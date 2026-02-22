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
  priority: number; // 1-10 scale (1 = most urgent, 10 = least)
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
  managers: string[]; // IDs of managers
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
  skip?: number;
  limit?: number;
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

export interface CSVUploadResponse {
  success: boolean;
  message: string;
  ticketsCount?: number;
  managersCount?: number;
  businessUnitsCount?: number;
}

// Константы для отображения на русском языке
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

export const MANAGER_POSITION_LABELS: Record<ManagerPosition, string> = {
  'Специалист': 'Специалист',
  'Ведущий специалист': 'Ведущий специалист',
  'Главный специалист': 'Главный специалист'
};

export const MANAGER_SKILL_LABELS: Record<ManagerSkill, string> = {
  'VIP': 'VIP клиенты',
  'ENG': 'Английский язык',
  'KZ': 'Казахский язык'
};

// Функции-хелперы для работы с типами
export const getTicketTypeFromString = (type: string): TicketType => {
  const map: Record<string, TicketType> = {
    'Жалоба': 'complaint',
    'Смена данных': 'data_change',
    'Консультация': 'consultation',
    'Претензия': 'claim',
    'Неработоспособность приложения': 'app_not_working',
    'Мошеннические действия': 'fraud',
    'Спам': 'spam'
  };
  return map[type] || 'consultation';
};

export const getLanguageFromString = (lang: string): Language => {
  const map: Record<string, Language> = {
    'ru': 'RU',
    'kz': 'KZ',
    'en': 'ENG'
  };
  return map[lang] || 'RU';
};

export const getSegmentFromString = (segment: string): Segment => {
  const map: Record<string, Segment> = {
    'VIP': 'VIP',
    'Priority': 'Priority',
    'Mass': 'Mass'
  };
  return map[segment] || 'Mass';
};

export const getPriorityNumber = (priority: string | number): number => {
  if (typeof priority === 'number') return priority;
  const map: Record<string, number> = {
    'urgent': 1,
    'high': 3,
    'medium': 5,
    'low': 8
  };
  return map[priority] || 5;
};

export const getPriorityLabel = (priority: number): string => {
  if (priority <= 2) return 'Критический';
  if (priority <= 4) return 'Высокий';
  if (priority <= 6) return 'Средний';
  if (priority <= 8) return 'Низкий';
  return 'Минимальный';
};