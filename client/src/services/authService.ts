import axios from 'axios';
import { config, logger } from '../config/environment';
import { protheusLoginSchema } from '../schemas/loginSchema';
import { getErrorMessage } from '../utils/translationHelpers';
import type {
  ProtheusLoginCredentials,
  ProtheusAuthResponse,
  ProtheusUser
} from '../types/auth';

// Brasil Protheus base URL
const BR_BASE_URL = 'http://brsvawssaa06069:8029';

export const authService = {
  // Login com username e password usando OAuth2
  async loginProtheus(credentials: ProtheusLoginCredentials): Promise<ProtheusAuthResponse> {
    try {
      console.log('authService.loginProtheus - Starting login with credentials');

      // Validate input data
      let validatedCredentials;
      try {
        validatedCredentials = protheusLoginSchema.parse(credentials);
        console.log('authService.loginProtheus - Credentials validated');
      } catch (validationError) {
        console.error('authService.loginProtheus - Validation error:', validationError);
        throw new Error('Usuário ou senha inválidos');
      }

      logger.info('Tentando autenticação OAuth2...');

      // Step 1: Get OAuth2 token
      console.log('authService.loginProtheus - Step 1: Getting OAuth2 token');
      const tokenUrl = `${BR_BASE_URL}/rest/api/oauth2/v1/token?grant_type=password&username=${encodeURIComponent(validatedCredentials.username)}&password=${encodeURIComponent(validatedCredentials.password)}`;

      const tokenResponse = await axios.post(tokenUrl, null, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      console.log('authService.loginProtheus - Token Response Status:', tokenResponse.status);
      console.log('authService.loginProtheus - Token Response Data:', JSON.stringify(tokenResponse.data, null, 2));

      // Check for password change requirement (Status 202 with message)
      if (tokenResponse.status === 202 && typeof tokenResponse.data === 'string') {
        if (tokenResponse.data.includes('troca de senha') || tokenResponse.data.includes('change password')) {
          throw new Error('Troca de senha necessária - Entre em contato com o administrador do sistema para redefinir sua senha');
        }
      }

      if (!tokenResponse.data || !tokenResponse.data.access_token) {
        console.error('authService.loginProtheus - Token not found in response. Full response:', tokenResponse.data);
        throw new Error('Falha na autenticação - Token não recebido');
      }

      const { access_token, refresh_token, expires_in, hasMFA } = tokenResponse.data;
      console.log('authService.loginProtheus - Token received successfully');

      // Step 2: Get User ID
      console.log('authService.loginProtheus - Step 2: Getting User ID');
      const userIdResponse = await axios.get(`${BR_BASE_URL}/rest/users/GetUserId`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      if (!userIdResponse.data || !userIdResponse.data.userID) {
        throw new Error('Falha ao obter ID do usuário');
      }

      const userId = userIdResponse.data.userID;
      console.log('authService.loginProtheus - User ID received:', userId);

      // Step 3: Get User Details
      console.log('authService.loginProtheus - Step 3: Getting User Details');
      const userDetailsResponse = await axios.get(`${BR_BASE_URL}/rest/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      if (!userDetailsResponse.data) {
        throw new Error('Falha ao obter detalhes do usuário');
      }

      const userData = userDetailsResponse.data;
      console.log('authService.loginProtheus - User details received');

      // Extract email from emails array
      const emailObj = userData.emails?.find((e: any) => e.primary) || userData.emails?.[0];
      const userEmail = emailObj?.value || userData.externalId || '';

      // Build user object
      const user: ProtheusUser = {
        id: userData.id || userId,
        username: userData.userName || validatedCredentials.username,
        name: userData.displayName || userData.name?.formatted || '',
        email: userEmail,
        givenName: userData.name?.givenName,
        familyName: userData.name?.familyName,
        displayName: userData.displayName,
        role: userData.title,
        department: userData.department,
        isActive: userData.active,
        groups: userData.groups || [],
        permissions: userData.roles?.map((r: any) => r.display) || [],
      };

      const response: ProtheusAuthResponse = {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        expires_in: expires_in || 3600,
        hasMFA,
        user,
      };

      logger.info('Login realizado com sucesso para:', user.username);
      console.log('authService.loginProtheus - Login successful');
      return response;

    } catch (error: any) {
      console.error('authService.loginProtheus - Error:', error);
      logger.error('Erro na autenticação Protheus:', error);

      // Handle different error types
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Usuário ou senha inválidos');
        } else if (error.response?.status === 403) {
          throw new Error('Acesso negado');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Tempo esgotado - Servidor não respondeu');
        } else if (error.code === 'ERR_NETWORK') {
          throw new Error('Erro de rede - Verifique sua conexão');
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

  // Verificar se usuário está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  // Obter usuário atual do localStorage
  getCurrentUser(): ProtheusUser | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      logger.warn('Erro ao recuperar usuário do localStorage:', error);
      return null;
    }
  }
};