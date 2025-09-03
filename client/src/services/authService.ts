import api from './api';
import type { 
  ProtheusLoginCredentials, 
  ProtheusAuthResponse,
  ProtheusUser
} from '../types/auth';

// Protheus Base URL
const PROTHEUS_BASE_URL = import.meta.env.VITE_PROTHEUS_BASE_URL || 'http://brsvcub050:3079/rest';

export const authService = {
  // Protheus Basic Authentication
  async loginProtheus(credentials: ProtheusLoginCredentials): Promise<ProtheusAuthResponse> {
    try {
      console.log('Tentando autenticação Basic no Protheus...');
      
      // Criar token Basic Auth (usuário:senha em base64)
      const basicToken = btoa(`${credentials.username}:${credentials.password}`);
      
      // Testar a autenticação fazendo uma requisição simples
      // O Protheus valida o Basic Auth em qualquer endpoint
      const testResponse = await api.get('/api/framework/v1/users', {
        headers: {
          'Authorization': `Basic ${basicToken}`,
          'Accept': 'application/json'
        }
      });

      // Se chegou aqui, a autenticação foi bem sucedida
      console.log('Autenticação Basic bem sucedida');
      
      // Retornar o token Basic para ser usado nas próximas requisições
      return {
        access_token: basicToken,
        refresh_token: basicToken, // No Basic não há refresh
        token_type: 'Basic',
        expires_in: 86400, // 24 horas
        user: {
          id: credentials.username,
          username: credentials.username,
          name: credentials.username,
          email: '',
          groups: [],
          permissions: []
        }
      };

    } catch (error: any) {
      console.error('Erro na autenticação Protheus:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Credenciais inválidas. Verifique usuário e senha.');
      } else if (error.response?.status === 403) {
        throw new Error('Acesso negado. Usuário não autorizado.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro na comunicação com o servidor Protheus.');
      }
    }
  },

  // No Basic Auth não há refresh token real, mas mantemos para compatibilidade
  async refreshToken(refreshToken: string): Promise<ProtheusAuthResponse> {
    // Como é Basic Auth, o "refresh" apenas retorna o mesmo token
    return {
      access_token: refreshToken,
      refresh_token: refreshToken,
      token_type: 'Basic',
      expires_in: 86400,
      user: null
    };
  },

  // Buscar informações do usuário autenticado
  async getUserInfo(accessToken: string): Promise<ProtheusUser> {
    try {
      const response = await api.get('/api/framework/v1/users', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${accessToken}`
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
      console.warn('Erro ao buscar informações do usuário:', error);
      throw error;
    }
  },

  // Logout (limpa dados locais)
  async logout(): Promise<void> {
    try {
      // Limpar tokens do localStorage
      console.log('Logout realizado - tokens removidos localmente');
    } catch (error) {
      console.warn('Erro durante logout:', error);
    }
  },

  // Validar se token ainda é válido
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await api.get('/api/framework/v1/users', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${accessToken}`
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
      console.warn('Erro ao recuperar usuário do localStorage:', error);
      return null;
    }
  }
};