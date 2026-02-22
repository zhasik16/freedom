import { apiClient } from './client';
import { 
  Ticket, Manager, BusinessUnitOffice, DashboardAnalytics, 
  DashboardFilters, AIQueryResponse, CSVUploadResponse,
  TicketType, Sentiment, Language, Segment, Address,
  Coordinates, AITicketAnalysis, ManagerPosition, ManagerSkill
} from '../types';

// Функция для трансформации данных из бэкенда в формат фронтенда
const transformTicket = (backendTicket: any): Ticket => {
  // Трансформация типа тикета
  const ticketTypeMap: Record<string, TicketType> = {
    'Жалоба': 'complaint',
    'Смена данных': 'data_change',
    'Консультация': 'consultation',
    'Претензия': 'claim',
    'Неработоспособность приложения': 'app_not_working',
    'Мошеннические действия': 'fraud',
    'Спам': 'spam'
  };

  // Трансформация языка
  const languageMap: Record<string, Language> = {
    'ru': 'RU',
    'kz': 'KZ',
    'en': 'ENG'
  };

  // Трансформация сегмента
  const segmentMap: Record<string, Segment> = {
    'VIP': 'VIP',
    'Priority': 'Priority',
    'Mass': 'Mass'
  };

  const enriched = backendTicket.enriched_data || {};
  
  return {
    id: backendTicket.id,
    clientGuid: backendTicket.client_guid,
    gender: 'female', // Значение по умолчанию, т.к. нет в бэкенде
    birthDate: new Date().toISOString(), // Значение по умолчанию
    segment: segmentMap[backendTicket.segment] || 'Mass',
    description: backendTicket.description,
    attachments: backendTicket.attachments || [],
    address: {
      country: 'Казахстан',
      region: '',
      city: backendTicket.assigned_office || '',
      street: '',
      building: '',
      fullAddress: backendTicket.address || '',
      coordinates: enriched.coordinates ? {
        lat: enriched.coordinates.lat,
        lng: enriched.coordinates.lon
      } : undefined
    },
    aiAnalysis: {
      type: ticketTypeMap[backendTicket.ticket_type] || 'consultation',
      sentiment: backendTicket.sentiment as Sentiment || 'neutral',
      priority: backendTicket.priority === 'urgent' ? 1 : 
                backendTicket.priority === 'high' ? 2 :
                backendTicket.priority === 'medium' ? 3 : 4,
      language: languageMap[backendTicket.language] || 'RU',
      summary: backendTicket.summary || '',
      recommendedAction: backendTicket.suggested_action || ''
    },
    assignedManagerId: backendTicket.assigned_manager,
    assignedAt: backendTicket.updated_at,
    businessUnit: backendTicket.assigned_office,
    createdAt: backendTicket.created_at
  };
};

const transformManager = (backendManager: any): Manager => {
  const positionMap: Record<string, ManagerPosition> = {
    'Специалист': 'Специалист',
    'Ведущий специалист': 'Ведущий специалист',
    'Главный специалист': 'Главный специалист'
  };

  const skillMap: Record<string, ManagerSkill> = {
    'VIP': 'VIP',
    'ENG': 'ENG',
    'KZ': 'KZ'
  };

  return {
    id: backendManager.ФИО,
    fullName: backendManager.ФИО,
    position: positionMap[backendManager['Должность ']?.trim()] || 'Специалист',
    skills: (backendManager.Навыки || []).map((s: string) => skillMap[s]).filter(Boolean),
    businessUnit: backendManager.Офис || '',
    currentLoad: backendManager['Количество обращений в работе'] || 0,
    isActive: true
  };
};

const transformBusinessUnit = (backendUnit: any): BusinessUnitOffice => {
  return {
    id: backendUnit.Офис,
    name: backendUnit.Офис,
    address: {
      country: 'Казахстан',
      region: '',
      city: backendUnit.Офис,
      street: '',
      building: '',
      fullAddress: backendUnit.Адрес || '',
      coordinates: backendUnit.coordinates ? {
        lat: backendUnit.coordinates.lat,
        lng: backendUnit.coordinates.lon
      } : undefined
    },
    managers: []
  };
};

export const ticketsApi = {
  getAll: (skip?: number, limit?: number) => 
    apiClient.get<any[]>('/api/tickets', { skip, limit })
      .then(tickets => tickets.map(transformTicket)),
  
  getById: (id: string) => 
    apiClient.get<any>(`/api/tickets/${id}`)
      .then(transformTicket),
  
  getNext: () => 
    apiClient.post<any>('/api/tickets/next')
      .then(transformTicket),
  
  create: (ticketData: {
    client_guid: string;
    description: string;
    segment?: string;
    address?: string;
    attachments?: string[];
  }) => apiClient.post<any>('/api/tickets', ticketData)
      .then(transformTicket),
  

  upload: (file: File) => 
    apiClient.uploadFile<CSVUploadResponse>('/api/tickets/upload', file),
};

export const managersApi = {
  getAll: (businessUnit?: string) => 
    apiClient.get<any[]>('/api/managers')
      .then(managers => {
        const transformed = managers.map(transformManager);
        if (businessUnit) {
          return transformed.filter(m => m.businessUnit === businessUnit);
        }
        return transformed;
      }),
  
  getById: (id: string) => 
    apiClient.get<any>(`/api/managers/${id}`)
      .then(transformManager),
  
  getLoad: () => 
    apiClient.get<{ managerId: string; load: number }[]>('/api/managers/load'),
};

export const businessUnitsApi = {
  getAll: () => 
    apiClient.get<any[]>('/api/business-units')
      .then(units => units.map(transformBusinessUnit)),
  
  getNearbyOffices: (address: string) => 
    apiClient.get<any>('/api/offices/nearby', { address })
      .then(data => ({
        client_coordinates: data.client_coordinates,
        nearest_office: {
          ...transformBusinessUnit(data.nearest_office),
          distance_km: data.nearest_office.distance_km
        },
        all_offices: data.all_offices.map((office: any) => ({
          ...transformBusinessUnit(office),
          distance_km: office.distance_km
        }))
      })),
};

export const analyticsApi = {
  getDashboard: (filters?: DashboardFilters) => {
    return Promise.all([
      apiClient.get<any>('/api/stats/assignments'),
      apiClient.get<any>('/api/stats/offices'),
      apiClient.get<any[]>('/api/tickets')
    ]).then(([assignments, offices, tickets]) => {
      const transformedTickets = tickets.map(transformTicket);
      
      // Создаем distribution объекты
      const typeDistribution: Record<TicketType, number> = {
        complaint: 0,
        data_change: 0,
        consultation: 0,
        claim: 0,
        app_not_working: 0,
        fraud: 0,
        spam: 0
      };
      
      const sentimentDistribution: Record<Sentiment, number> = {
        positive: 0,
        neutral: 0,
        negative: 0
      };
      
      const languageDistribution: Record<Language, number> = {
        KZ: 0,
        ENG: 0,
        RU: 0
      };
      
      const segmentDistribution: Record<Segment, number> = {
        Mass: 0,
        VIP: 0,
        Priority: 0
      };
      
      const businessUnitDistribution: Record<string, number> = {};
      
      // Заполняем распределения из данных assignments
      if (assignments) {
        // Маппинг из бэкенда в типы фронтенда
        const typeMap: Record<string, TicketType> = {
          'Жалоба': 'complaint',
          'Смена данных': 'data_change',
          'Консультация': 'consultation',
          'Претензия': 'claim',
          'Неработоспособность приложения': 'app_not_working',
          'Мошеннические действия': 'fraud',
          'Спам': 'spam'
        };
        
        Object.entries(assignments.by_type || {}).forEach(([key, value]) => {
          const mappedKey = typeMap[key];
          if (mappedKey) typeDistribution[mappedKey] = value as number;
        });
        
        Object.entries(assignments.by_priority || {}).forEach(([key, value]) => {
          if (key === 'urgent') sentimentDistribution.negative += value as number;
          else if (key === 'high') sentimentDistribution.negative += value as number * 0.5;
          else if (key === 'medium') sentimentDistribution.neutral += value as number;
          else sentimentDistribution.positive += value as number;
        });
        
        Object.entries(assignments.by_office || {}).forEach(([key, value]) => {
          businessUnitDistribution[key] = value as number;
        });
      }
      
      // Заполняем остальные распределения из тикетов
      transformedTickets.forEach(ticket => {
        if (ticket.aiAnalysis) {
          languageDistribution[ticket.aiAnalysis.language] = 
            (languageDistribution[ticket.aiAnalysis.language] || 0) + 1;
          
          segmentDistribution[ticket.segment] = 
            (segmentDistribution[ticket.segment] || 0) + 1;
        }
      });
      
      const dashboardData: DashboardAnalytics = {
        totalTickets: assignments?.total_tickets || transformedTickets.length,
        avgPriority: transformedTickets.reduce((acc, t) => 
          acc + (t.aiAnalysis?.priority || 3), 0) / (transformedTickets.length || 1),
        typeDistribution,
        sentimentDistribution,
        languageDistribution,
        segmentDistribution,
        businessUnitDistribution,
        managerLoad: (offices || []).flatMap((office: any) => 
          (office.managers || []).map((m: any) => ({
            managerId: m.name,
            managerName: m.name,
            load: m.load,
            businessUnit: office.office,
            position: m.position || 'Специалист',
            skills: (m.skills || []).map((s: string) => {
              const skillMap: Record<string, ManagerSkill> = {
                'VIP': 'VIP',
                'ENG': 'ENG',
                'KZ': 'KZ'
              };
              return skillMap[s];
            }).filter(Boolean)
          }))
        ),
        unassignedTickets: transformedTickets.filter(t => !t.assignedManagerId).length,
        ticketsByCity: transformedTickets.reduce((acc, t) => {
          const city = t.address?.city || 'Unknown';
          acc[city] = (acc[city] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      return dashboardData;
    });
  },
  
  getDistribution: (groupBy: string) => 
    apiClient.get<any>('/api/stats/assignments').then(data => {
      const groupMap: Record<string, string> = {
        'priority': 'by_priority',
        'type': 'by_type',
        'office': 'by_office',
        'reason': 'by_reason',
        'segment': 'by_segment',
        'skills': 'by_required_skills'
      };
      const key = groupMap[groupBy] || 'by_priority';
      
      // Трансформируем ключи для фронтенда если нужно
      const result: Record<string, number> = {};
      const backendData = data[key] || {};
      
      if (groupBy === 'type') {
        const typeMap: Record<string, string> = {
          'Жалоба': 'complaint',
          'Смена данных': 'data_change',
          'Консультация': 'consultation',
          'Претензия': 'claim',
          'Неработоспособность приложения': 'app_not_working',
          'Мошеннические действия': 'fraud',
          'Спам': 'spam'
        };
        Object.entries(backendData).forEach(([k, v]) => {
          const mappedKey = typeMap[k];
          if (mappedKey) result[mappedKey] = v as number;
        });
      } else {
        Object.assign(result, backendData);
      }
      
      return result;
    }),
  
  queryAI: (query: string, filters?: DashboardFilters) => {
    return Promise.resolve({
      type: 'text' as const,
      title: 'AI Анализ запроса',
      description: `Результат анализа запроса: "${query}"`,
      data: {
        query,
        filters: filters || {},
        timestamp: new Date().toISOString()
      },
      visualization: {
        chartType: 'table'
      }
    } as AIQueryResponse);
  },
  
  getGeoData: () => 
    apiClient.get<any[]>('/api/geo-data').then(data => 
      data.map(item => ({
        ticketId: item.ticketId,
        coordinates: item.coordinates,
        type: item.type
      }))
    ),
  
  getOfficeStats: () => 
    apiClient.get('/api/stats/offices'),
  
  getAssignmentStats: () => 
    apiClient.get('/api/stats/assignments'),
  
  getRoundRobinStats: () => 
    apiClient.get('/api/stats/round-robin'),
};