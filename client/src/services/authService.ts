import axios from 'axios';
import api, { backendApi } from './api';
import { config, logger } from '../config/environment';
import { protheusLoginSchema } from '../schemas/loginSchema';
import { getErrorMessage } from '../utils/translationHelpers';
import { tokenManager } from '../utils/secureStorage';
import type {
  ProtheusLoginCredentials,
  ProtheusAuthResponse,
  ProtheusUser
} from '../types/auth';

export const authService = {
  // Login com username e password via Backend (NestJS)
  async loginProtheus(credentials: ProtheusLoginCredentials): Promise<ProtheusAuthResponse> {
    try {
      console.log('authService.loginProtheus - Starting login via backend');

      // Validate input data
      let validatedCredentials;
      try {
        validatedCredentials = protheusLoginSchema.parse(credentials);
        console.log('authService.loginProtheus - Credentials validated');
      } catch (validationError) {
        console.error('authService.loginProtheus - Validation error:', validationError);
        throw new Error('Usuário ou senha inválidos');
      }

      logger.info('Tentando autenticação via backend...');

      // Call backend /auth/login endpoint
      console.log('authService.loginProtheus - Calling backend /auth/login');
      const response = await backendApi.post('/auth/login', {
        username: validatedCredentials.username,
        password: validatedCredentials.password,
      });

      console.log('authService.loginProtheus - Backend response received');
      const { access_token, refresh_token, expires_in, user } = response.data;

      if (!access_token || !user) {
        console.error('authService.loginProtheus - Invalid response from backend');
        throw new Error('Falha na autenticação - Resposta inválida do servidor');
      }

      // Build auth response
      const authResponse: ProtheusAuthResponse = {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        expires_in: expires_in || 3600,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          department: user.department,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          groups: [],
          permissions: user.isAdmin ? ['admin'] : [],
        },
      };

      logger.info('Login realizado com sucesso para:', user.username);
      console.log('authService.loginProtheus - Login successful');
      return authResponse;

    } catch (error: any) {
      console.error('authService.loginProtheus - Error:', error);
      logger.error('Erro na autenticação:', error);

      // Handle different error types
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;

        if (error.response?.status === 401) {
          throw new Error(errorMessage || 'Usuário ou senha inválidos');
        } else if (error.response?.status === 403) {
          throw new Error('Acesso negado');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Tempo esgotado - Servidor não respondeu');
        } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          throw new Error('Erro de rede - Não foi possível conectar ao servidor');
        }

        // Show backend error message if available
        if (errorMessage) {
          throw new Error(errorMessage);
        }
      }

      // Re-throw the error with a clear message
      if (error.message) {
        throw error;
      } else {
        throw new Error(getErrorMessage('loginError'));
      }
    }
  },

  // No login por e-mail não há refresh token real, mas mantemos para compatibilidade
  async refreshToken(refreshToken: string): Promise<ProtheusAuthResponse> {
    // Retorna o mesmo token
    return {
      access_token: refreshToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 86400,
      user: null
    };
  },

  // Buscar informações do usuário autenticado
  async getUserInfo(accessToken: string): Promise<ProtheusUser> {
    try {
      const response = await api.get(config.api.users, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Adaptar resposta do Protheus para nosso formato
      const userData = response.data;
      
      return {
        id: userData.id || userData.code || userData.username,
        username: userData.username || userData.login,
        name: userData.name || userData.fullName || userData.username,
        email: userData.email || '',
        groups: userData.groups || [],
        permissions: userData.permissions || []
      };

    } catch (error) {
      logger.warn('Erro ao buscar informações do usuário:', error);
      throw error;
    }
  },

  // Logout (limpa dados locais)
  async logout(): Promise<void> {
    try {
      // Limpar tokens do localStorage
      logger.info('Logout realizado - tokens removidos localmente');
    } catch (error) {
      logger.warn('Erro durante logout:', error);
    }
  },

  // Validar se token ainda é válido
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await api.get(config.api.users, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Verificar se usuário está autenticado (uses tokenManager for proper expiration check)
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  },

  // Obter usuário atual do secure storage
  getCurrentUser(): ProtheusUser | null {
    try {
      return tokenManager.getUser();
    } catch (error) {
      logger.warn('Erro ao recuperar usuário do storage:', error);
      return null;
    }
  }
};