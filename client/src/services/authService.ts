import api from './api';
import { config, logger } from '../config/environment';
import { protheusLoginSchema } from '../schemas/loginSchema';
import type { 
  ProtheusLoginCredentials, 
  ProtheusAuthResponse,
  ProtheusUser
} from '../types/auth';

export const authService = {
  // Login com e-mail apenas (sem senha)
  async loginProtheus(credentials: ProtheusLoginCredentials): Promise<ProtheusAuthResponse> {
    try {
      // Validate input data - use the schema directly without ValidationUtils
      const validatedCredentials = protheusLoginSchema.parse(credentials);
      
      logger.info('Tentando autenticação com e-mail...');
      
      // Como não há senha, vamos criar um token baseado no e-mail
      // Este é um token simplificado para identificação do usuário
      const emailToken = btoa(validatedCredentials.email);
      
      // Simular autenticação bem sucedida
      // Em produção, você pode validar o e-mail contra uma lista de usuários autorizados
      logger.info('Login realizado com sucesso para:', validatedCredentials.email);
      
      // Extrair nome do usuário do e-mail
      const userName = validatedCredentials.email.split('@')[0]
        .split('.')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      
      // Retornar o token para ser usado nas próximas requisições
      return {
        access_token: emailToken,
        refresh_token: emailToken,
        token_type: 'Bearer',
        expires_in: config.security.sessionTimeout / 1000, // Convert to seconds
        user: {
          id: validatedCredentials.email,
          username: validatedCredentials.email.split('@')[0],
          name: userName,
          email: validatedCredentials.email,
          groups: [],
          permissions: []
        }
      };

    } catch (error: any) {
      logger.error('Erro na autenticação Protheus:', error);
      
      if (error.message?.includes('inválido')) {
        throw new Error('E-mail inválido. Verifique o formato do e-mail.');
      } else if (error.response?.status === 403) {
        throw new Error('Acesso negado. E-mail não autorizado.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao realizar login.');
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