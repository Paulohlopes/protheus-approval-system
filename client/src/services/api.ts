import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// Base API configuration for Protheus ERP
const PROTHEUS_BASE_URL = import.meta.env.VITE_PROTHEUS_BASE_URL || 'http://brsvcub050:3079/rest';
const API_BASE_URL = PROTHEUS_BASE_URL; // Direct connection to Protheus

// Create axios instance for Protheus API
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // Increased timeout for ERP operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Create direct axios instance for authentication (bypasses proxy)
export const authApi: AxiosInstance = axios.create({
  baseURL: PROTHEUS_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem('access_token'),
  getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
  setTokens: (accessToken: string, refreshToken?: string, user?: any, tokenType?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (tokenType) {
      localStorage.setItem('token_type', tokenType);
    }
  },
  removeTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_type');
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    
    if (token && config.headers) {
      // Verificar o tipo de token (Basic ou Bearer)
      if (tokenType === 'Basic') {
        config.headers.Authorization = `Basic ${token}`;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Para Basic Auth, se der 401 é porque as credenciais expiraram ou são inválidas
    if (error.response?.status === 401) {
      // Limpar tokens e redirecionar para login
      tokenManager.removeTokens();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;