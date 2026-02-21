const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ApiConfig {
  baseURL: string;
  headers: Record<string, string>;
}

class ApiClient {
  private config: ApiConfig;

  constructor() {
    this.config = {
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, String(params[key]))
      );
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.config.headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.config.headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async uploadFile(endpoint: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();