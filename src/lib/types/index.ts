export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  country: string;
  region: string;
  city: string;
  street: string;
  building: string;
  fullAddress?: string;
  coordinates?: Coordinates;
}

export type TicketType = 
  | 'complaint'
  | 'data_change'
  | 'consultation'
  | 'claim'
  | 'app_not_working'
  | 'fraud'
  | 'spam';

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Language = 'KZ' | 'ENG' | 'RU';
export type Segment = 'Mass' | 'VIP' | 'Priority';
export type ManagerPosition = 'Специалист' | 'Ведущий специалист' | 'Главный специалист';
export type ManagerSkill = 'VIP' | 'ENG' | 'KZ';
export type BusinessUnit = string;

export interface AITicketAnalysis {
  type: TicketType;
  sentiment: Sentiment;
  priority: number;
  language: Language;
  summary: string;
  recommendedAction: string;
}

export interface Ticket {
  id: string;
  clientGuid: string;
  gender: 'male' | 'female';
  birthDate: string;
  segment: Segment;
  description: string;
  attachments?: string[];
  address: Address;
  aiAnalysis?: AITicketAnalysis;
  assignedManagerId?: string;
  assignedAt?: string;
  businessUnit?: BusinessUnit;
  createdAt?: string;
}

export interface Manager {
  id: string;
  fullName: string;
  position: ManagerPosition;
  skills: ManagerSkill[];
  businessUnit: BusinessUnit;
  currentLoad: number;
  isActive?: boolean;
}

export interface BusinessUnitOffice {
  id: string;
  name: BusinessUnit;
  address: Address;
  managers: string[];
}

export interface DashboardFilters {
  businessUnit?: BusinessUnit[];
  ticketType?: TicketType[];
  sentiment?: Sentiment[];
  language?: Language[];
  segment?: Segment[];
  priorityMin?: number;
  priorityMax?: number;
  searchQuery?: string;
  assigned?: boolean;
}

export interface DashboardAnalytics {
  totalTickets: number;
  avgPriority: number;
  typeDistribution: Record<TicketType, number>;
  sentimentDistribution: Record<Sentiment, number>;
  languageDistribution: Record<Language, number>;
  segmentDistribution: Record<Segment, number>;
  businessUnitDistribution: Record<BusinessUnit, number>;
  managerLoad: {
    managerId: string;
    managerName: string;
    load: number;
    businessUnit: BusinessUnit;
    position: ManagerPosition;
    skills: ManagerSkill[];
  }[];
  unassignedTickets: number;
  ticketsByCity: Record<string, number>;
}

export interface AIQueryResponse {
  type: 'chart' | 'table' | 'text' | 'map';
  title: string;
  description?: string;
  data: any;
  visualization?: {
    chartType?: 'bar' | 'pie' | 'line' | 'map' | 'heatmap' | 'table';
    xAxis?: string;
    yAxis?: string;
  };
}

// Добавленный интерфейс
export interface CSVUploadResponse {
  success: boolean;
  message: string;
  ticketsCount?: number;
  managersCount?: number;
  businessUnitsCount?: number;
}

// Константы
export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  complaint: 'Жалоба',
  data_change: 'Смена данных',
  consultation: 'Консультация',
  claim: 'Претензия',
  app_not_working: 'Неработоспособность приложения',
  fraud: 'Мошеннические действия',
  spam: 'Спам'
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: 'Позитивный',
  neutral: 'Нейтральный',
  negative: 'Негативный'
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  KZ: 'Қазақша',
  ENG: 'English',
  RU: 'Русский'
};

export const SEGMENT_LABELS: Record<Segment, string> = {
  Mass: 'Массовый',
  VIP: 'VIP',
  Priority: 'Приоритетный'
};