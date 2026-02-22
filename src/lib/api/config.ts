// Флаг для переключения между моками и реальным API
export const USE_MOCKS = false; // false = используем реальный бэкенд

// URL бэкенда
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';