import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { config, logger } from '../config/environment';

// Base API configuration for Protheus ERP
const API_BASE_URL = config.protheus.baseUrl;

// Create axios instance for Protheus API
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: config.protheus.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Create direct axios instance for authentication (bypasses proxy)
export const authApi: AxiosInstance = axios.create({
  baseURL: config.protheus.baseUrl,
  timeout: config.protheus.apiTimeout,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
});

// Import secure token manager
import { tokenManager } from '../utils/secureStorage';

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();
    const tokenType = tokenManager.getTokenType() || 'Bearer';
    
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