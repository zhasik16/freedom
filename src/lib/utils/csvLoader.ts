import { 
  Ticket, Manager, BusinessUnitOffice, Address, 
  Segment, ManagerPosition, ManagerSkill, TicketType,
  Sentiment, Language 
} from '@/lib/types';

interface RawCSVRow {
  [key: string]: string;
}

export function parseCSV<T>(csvText: string, mapper: (row: RawCSVRow) => T): T[] {
  try {
    const cleanText = csvText.replace(/^\uFEFF/, '');
    const lines = cleanText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const results: T[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let inQuotes = false;
      let currentValue = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.replace(/^["']|["']$/g, '').trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.replace(/^["']|["']$/g, '').trim());

      const row: RawCSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const mapped = mapper(row);
        results.push(mapped);
      } catch (err) {
        console.warn(`Ошибка парсинга строки ${i + 1}:`, err);
      }
    }

    return results;
  } catch (error) {
    console.error('Ошибка парсинга CSV:', error);
    return [];
  }
}

export async function loadCSVFile<T>(
  filename: string, 
  mapper: (row: RawCSVRow) => T
): Promise<T[]> {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    return parseCSV(csvText, mapper);
  } catch (error) {
    console.error(`Ошибка загрузки ${filename}:`, error);
    return [];
  }
}

export function mapToBusinessUnit(row: RawCSVRow): BusinessUnitOffice {
  const officeName = row['Офис']?.trim() || '';
  const fullAddress = row['Адрес']?.trim() || '';
  
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'Актау': { lat: 43.6500, lng: 51.1667 },
    'Актобе': { lat: 50.2833, lng: 57.1667 },
    'Алматы': { lat: 43.2389, lng: 76.8897 },
    'Астана': { lat: 51.1605, lng: 71.4704 },
    'Атырау': { lat: 47.1167, lng: 51.8833 },
    'Караганда': { lat: 49.8333, lng: 73.1667 },
    'Кокшетау': { lat: 53.2833, lng: 69.3833 },
    'Костанай': { lat: 53.2167, lng: 63.6333 },
    'Кызылорда': { lat: 44.8500, lng: 65.5167 },
    'Павлодар': { lat: 52.3000, lng: 76.9500 },
    'Петропавловск': { lat: 54.8833, lng: 69.1667 },
    'Тараз': { lat: 42.9000, lng: 71.3667 },
    'Уральск': { lat: 51.2333, lng: 51.3667 },
    'Усть-Каменогорск': { lat: 49.9833, lng: 82.6167 },
    'Шымкент': { lat: 42.3000, lng: 69.6000 }
  };

  const address: Address = {
    country: 'Казахстан',
    region: '',
    city: officeName,
    street: fullAddress.split(',')[0] || fullAddress,
    building: fullAddress.split(',').slice(1).join(',').trim() || '',
    fullAddress,
    coordinates: cityCoordinates[officeName] || undefined
  };

  return {
    id: `unit-${officeName.toLowerCase().replace(/\s+/g, '-')}`,
    name: officeName,
    address,
    managers: []
  };
}

export function mapToManager(row: RawCSVRow): Manager {
  const skillsStr = row['Навыки']?.trim() || '';
  let skills: ManagerSkill[] = [];
  
  if (skillsStr) {
    skills = skillsStr.split(',').map(s => s.trim()).filter(s => 
      ['VIP', 'ENG', 'KZ'].includes(s)
    ) as ManagerSkill[];
  }

  let position: ManagerPosition = 'Специалист';
  const positionRaw = row['Должность']?.trim() || '';
  
  if (positionRaw.includes('Главный')) {
    position = 'Главный специалист';
  } else if (positionRaw.includes('Ведущий')) {
    position = 'Ведущий специалист';
  }

  return {
    id: `manager-${Math.random().toString(36).substr(2, 9)}`,
    fullName: row['ФИО']?.trim() || '',
    position,
    skills,
    businessUnit: row['Офис']?.trim() || '',
    currentLoad: parseInt(row['Количество обращений в работе']?.trim() || '0') || 0,
    isActive: true
  };
}

export function mapToTicket(row: RawCSVRow): Partial<Ticket> {
  const gender = (row['Пол клиента'] || '').toLowerCase().includes('жен') ? 'female' : 'male';
  const segment = (row['Сегмент клиента']?.trim() || 'Mass') as Segment;
  
  let birthDate = row['Дата рождения']?.trim() || '';
  if (birthDate.includes(' ')) birthDate = birthDate.split(' ')[0];

  const city = row['Населённый пункт']?.trim() || '';
  const address: Address = {
    country: row['Страна']?.trim() || 'Казахстан',
    region: row['Область']?.trim() || '',
    city: city,
    street: row['Улица']?.trim() || '',
    building: row['Дом']?.trim() || '',
    fullAddress: [row['Страна'], row['Область'], city, row['Улица'], row['Дом']].filter(Boolean).join(', ')
  };

  const description = row['Описание']?.trim() || '';
  
  // AI анализ
  let language: Language = 'RU';
  const hasKazakh = /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(description);
  const hasEnglish = /[a-zA-Z]/.test(description);
  if (hasKazakh) language = 'KZ';
  else if (hasEnglish && !/[а-яА-Я]/.test(description)) language = 'ENG';

  let sentiment: Sentiment = 'neutral';
  const negativeWords = ['срочно', 'проблема', 'ошибка', 'мошенник', 'блокировка', 'жалоба'];
  const positiveWords = ['спасибо', 'отлично', 'работает'];
  const lowerDesc = description.toLowerCase();
  
  if (negativeWords.some(w => lowerDesc.includes(w))) sentiment = 'negative';
  else if (positiveWords.some(w => lowerDesc.includes(w))) sentiment = 'positive';

  let type: TicketType = 'consultation';
  if (lowerDesc.includes('смен') || lowerDesc.includes('измен')) type = 'data_change';
  else if (lowerDesc.includes('жалоб')) type = 'complaint';
  else if (lowerDesc.includes('деньг') || lowerDesc.includes('верн')) type = 'claim';
  else if (lowerDesc.includes('приложен') || lowerDesc.includes('войти')) type = 'app_not_working';
  else if (lowerDesc.includes('мошен')) type = 'fraud';
  else if (lowerDesc.includes('тюльпан') || lowerDesc.includes('сварочн')) type = 'spam';

  let priority = 5;
  if (type === 'complaint' || type === 'claim') priority = 8;
  else if (type === 'app_not_working') priority = 7;
  else if (type === 'fraud') priority = 9;
  else if (type === 'spam') priority = 1;
  
  if (lowerDesc.includes('срочно')) priority = Math.min(priority + 2, 10);

  return {
    id: row['GUID клиента']?.trim() || `ticket-${Math.random()}`,
    clientGuid: row['GUID клиента']?.trim() || '',
    gender,
    birthDate,
    segment,
    description,
    attachments: row['Вложения']?.trim() ? [row['Вложения'].trim()] : undefined,
    address,
    aiAnalysis: {
      type,
      sentiment,
      priority,
      language,
      summary: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
      recommendedAction: getRecommendedAction(type, sentiment, priority)
    }
  };
}

function getRecommendedAction(type: TicketType, sentiment: Sentiment, priority: number): string {
  if (type === 'complaint' || type === 'claim') return 'Связаться с клиентом в течение 2 часов';
  if (type === 'fraud') return 'Немедленно передать в службу безопасности';
  if (type === 'app_not_working') return 'Проверить статус аккаунта и помочь с входом';
  if (type === 'data_change') return 'Верифицировать личность и обновить данные';
  if (type === 'spam') return 'Отметить как спам и закрыть обращение';
  return 'Предоставить консультацию по запросу';
}

export async function loadAllData() {
  try {
    const [tickets, managers, businessUnits] = await Promise.all([
      loadCSVFile('tickets.csv', mapToTicket),
      loadCSVFile('managers.csv', mapToManager),
      loadCSVFile('business_units.csv', mapToBusinessUnit)
    ]);

    // Связываем данные
    const unitMap = new Map(businessUnits.map(u => [u.name, u]));
    
    managers.forEach(manager => {
      const unit = unitMap.get(manager.businessUnit);
      if (unit) unit.managers.push(manager.id);
    });

    const processedTickets = tickets.map((ticket, index) => {
      const foundUnit = businessUnits.find(u => 
        u.address.city.toLowerCase() === ticket.address?.city?.toLowerCase()
      );
      
      return {
        ...ticket,
        id: ticket.id || `ticket-${index + 1}`,
        clientGuid: ticket.clientGuid || `client-${index + 1}`,
        gender: ticket.gender || 'male',
        birthDate: ticket.birthDate || '1980-01-01',
        segment: ticket.segment || 'Mass',
        description: ticket.description || '',
        address: ticket.address || { country: '', region: '', city: '', street: '', building: '' },
        aiAnalysis: ticket.aiAnalysis,
        businessUnit: foundUnit?.name,
        createdAt: new Date().toISOString()
      } as Ticket;
    });

    return {
      tickets: processedTickets,
      managers,
      businessUnits
    };
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    return { tickets: [], managers: [], businessUnits: [] };
  }
}