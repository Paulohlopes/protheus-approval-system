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
      // Se for Basic auth, usar diretamente, senão usar Bearer
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          // Use Protheus refresh token endpoint
          const refreshUrl = import.meta.env.VITE_OAUTH2_REFRESH_URL || '/tlpp/oauth2/token';
          const refreshResponse = await authApi.post(
            `${refreshUrl}?grant_type=refresh_token&refresh_token=${refreshToken}`
          );
          
          const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;
          tokenManager.setTokens(access_token, newRefreshToken || refreshToken);
          
          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenManager.removeTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        tokenManager.removeTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;