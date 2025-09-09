import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { tokenManager } from '../utils/secureStorage';
import type { 
  ProtheusUser, 
  ProtheusLoginCredentials, 
  AuthState 
} from '../types/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: ProtheusLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  setUser: (user: ProtheusUser | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: ProtheusLoginCredentials | { email: string }) => {
        console.log('authStore.login - Starting login with:', credentials);
        set({ isLoading: true, error: null });
        
        try {
          // Converter formato do formulário para formato esperado pelo serviço
          const loginData: ProtheusLoginCredentials = 'email' in credentials 
            ? { email: credentials.email }
            : credentials;
          
          console.log('authStore.login - Calling authService with:', loginData);
          const response = await authService.loginProtheus(loginData);
          console.log('authStore.login - Received response:', response);
          
          // Salvar tokens e usuário usando secure tokenManager
          const success = tokenManager.setTokens(
            response.access_token, 
            response.refresh_token, 
            response.user,
            response.token_type
          );

          if (!success) {
            console.error('authStore.login - Failed to save tokens');
            throw new Error('Falha ao salvar credenciais de autenticação');
          }
          
          console.log('authStore.login - Login successful, setting state');
          set({
            user: response.user || null,
            token: response.access_token,
            refreshToken: response.refresh_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('authStore.login - Error:', error);
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Erro ao fazer login',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          console.warn('Error during logout:', error);
        } finally {
          // Limpar tokens usando tokenManager
          tokenManager.removeTokens();
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuthToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.refreshToken(refreshToken);
          
          set({
            token: response.access_token,
            refreshToken: response.refresh_token || refreshToken,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Erro ao renovar token',
          });
          throw error;
        }
      },

      setUser: (user: ProtheusUser | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      setRefreshToken: (refreshToken: string | null) => {
        set({ refreshToken });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        const token = tokenManager.getToken();
        const refreshToken = tokenManager.getRefreshToken();
        const user = tokenManager.getUser();
        const isAuthenticated = tokenManager.isAuthenticated();

        set({
          user,
          token,
          refreshToken,
          isAuthenticated,
        });
      },
    }),
    {
      name: 'auth-store',
      // Only persist essential auth state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);