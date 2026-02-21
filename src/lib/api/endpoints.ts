import { apiClient } from './client';
import { 
  Ticket, Manager, BusinessUnitOffice, DashboardAnalytics, 
  DashboardFilters, AIQueryResponse, CSVUploadResponse 
} from '../types';

export const ticketsApi = {
  getAll: (filters?: DashboardFilters) => 
    apiClient.get<Ticket[]>('/tickets', filters),
  
  getById: (id: string) => 
    apiClient.get<Ticket>(`/tickets/${id}`),
  
  upload: (file: File) => 
    apiClient.uploadFile('/tickets/upload', file),
  
  assign: (ticketId: string, managerId: string) => 
    apiClient.post<Ticket>(`/tickets/${ticketId}/assign`, { managerId }),
};

export const managersApi = {
  getAll: (businessUnit?: string) => 
    apiClient.get<Manager[]>('/managers', { businessUnit }),
  
  getById: (id: string) => 
    apiClient.get<Manager>(`/managers/${id}`),
  
  getLoad: () => 
    apiClient.get<{ managerId: string; load: number }[]>('/managers/load'),
};

export const businessUnitsApi = {
  getAll: () => 
    apiClient.get<BusinessUnitOffice[]>('/business-units'),
};

export const analyticsApi = {
  getDashboard: (filters?: DashboardFilters) => 
    apiClient.get<DashboardAnalytics>('/analytics/dashboard', filters),
  
  getDistribution: (groupBy: string) => 
    apiClient.get<Record<string, number>>(`/analytics/distribution/${groupBy}`),
  
  queryAI: (query: string, filters?: DashboardFilters) => 
    apiClient.post<AIQueryResponse>('/ai/query', { query, filters }),
  
  getGeoData: () => 
    apiClient.get<{ ticketId: string; coordinates: number[]; type: string }[]>('/analytics/geo'),
};