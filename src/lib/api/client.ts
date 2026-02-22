import { API_BASE_URL, USE_MOCKS } from './config';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    if (USE_MOCKS) {
      return this.getMockData<T>(endpoint, params);
    }

    // Убираем дублирование /api если оно уже есть в endpoint
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Правильно формируем URL
    let urlString = `${this.baseURL}${cleanEndpoint}`;
    const url = new URL(urlString);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          // Преобразуем объекты в строки правильно
          const value = params[key];
          if (typeof value === 'object') {
            url.searchParams.append(key, JSON.stringify(value));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    console.log(`🌐 GET Request: ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors', // 👈 Добавьте явно режим CORS
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    if (USE_MOCKS) {
      return this.getMockData<T>(endpoint, undefined, data);
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${cleanEndpoint}`;

    console.log(`🌐 POST Request: ${url}`, data);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async uploadFile<T = any>(endpoint: string, file: File): Promise<T> {
    if (USE_MOCKS) {
      return { success: true, message: 'Mock upload' } as T;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${cleanEndpoint}`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private getMockData<T>(endpoint: string, params?: any, data?: any): T {
    console.warn('📦 Using mock data for:', endpoint, { params, data });
    
    // Базовые моковые данные для разных эндпоинтов
    const mockData: Record<string, any> = {
      '/api/tickets': [],
      '/api/managers': [],
      '/api/business-units': [],
      '/api/stats/assignments': {
        total_tickets: 0,
        by_office: {},
        by_reason: {},
        by_priority: {},
        by_type: {},
        by_segment: {},
        by_required_skills: {},
        round_robin_stats: {}
      },
      '/api/stats/offices': [],
      '/api/geo-data': []
    };

    // Ищем подходящий мок по эндпоинту
    for (const [key, value] of Object.entries(mockData)) {
      if (endpoint.includes(key)) {
        return value as T;
      }
    }

    // Если ничего не нашли, возвращаем пустой объект
    return {} as T;
  }
}

export const apiClient = new ApiClient();