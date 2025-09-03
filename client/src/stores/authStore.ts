import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { tokenManager } from '../services/api';
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
      login: async (credentials: ProtheusLoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.loginProtheus(credentials);
          
          // Salvar tokens e usuário usando tokenManager
          tokenManager.setTokens(
            response.access_token, 
            response.refresh_token, 
            response.user,
            response.token_type
          );
          
          set({
            user: response.user || null,
            token: response.access_token,
            refreshToken: response.refresh_token || null,
            isAuthenticated: true,
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
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getCurrentUser();
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

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