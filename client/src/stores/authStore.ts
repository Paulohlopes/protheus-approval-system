import { create } from 'zustand';
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
  initializeAuth: () => void;
}

// Helper to get initial state from tokenManager
const getInitialAuthState = () => {
  const token = tokenManager.getToken();
  const refreshToken = tokenManager.getRefreshToken();
  const user = tokenManager.getUser();
  const isAuthenticated = tokenManager.isAuthenticated();

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
  };
};

export const useAuthStore = create<AuthStore>()(
  (set, get) => ({
    // Initial state - synchronized from tokenManager
    ...getInitialAuthState(),
    isLoading: false,
    error: null,

    // Initialize auth state from secure storage
    initializeAuth: () => {
      const authState = getInitialAuthState();
      console.log('authStore.initializeAuth - Syncing from tokenManager:', {
        hasToken: !!authState.token,
        hasUser: !!authState.user,
        isAuthenticated: authState.isAuthenticated,
      });
      set(authState);
    },

    // Actions
    login: async (credentials: ProtheusLoginCredentials | { username: string; password: string }) => {
      console.log('authStore.login - Starting login');
      set({ isLoading: true, error: null });

      try {
        // Converter formato do formulário para formato esperado pelo serviço
        const loginData: ProtheusLoginCredentials = {
          username: credentials.username,
          password: credentials.password,
        };

        console.log('authStore.login - Calling authService');
        const response = await authService.loginProtheus(loginData);
        console.log('authStore.login - Received response');

        // Convert expires_in from seconds to milliseconds
        const expiresInMs = response.expires_in ? response.expires_in * 1000 : undefined;

        // Salvar tokens e usuário usando secure tokenManager with server-provided expiration
        const success = tokenManager.setTokens(
          response.access_token,
          response.refresh_token,
          response.user,
          response.token_type,
          expiresInMs
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

        // Also clear any legacy Zustand persist data
        localStorage.removeItem('auth-store');

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
  })
);

// Clean up any legacy Zustand persist data on module load
if (typeof window !== 'undefined') {
  localStorage.removeItem('auth-store');
}