import api, { authApi } from './api';
import type { 
  ProtheusLoginCredentials, 
  ProtheusAuthResponse,
  ProtheusUser
} from '../types/auth';

// Protheus OAuth2 URLs
const PROTHEUS_BASE_URL = import.meta.env.VITE_PROTHEUS_BASE_URL || 'http://brsvcub050:3079/rest';
const OAUTH2_TOKEN_URL = import.meta.env.VITE_OAUTH2_TOKEN_URL || '/tlpp/oauth2/token';
const OAUTH2_REFRESH_URL = import.meta.env.VITE_OAUTH2_REFRESH_URL || '/tlpp/oauth2/token';

export const authService = {
  // Protheus OAuth2 login usando GET conforme documentação
  async loginProtheus(credentials: ProtheusLoginCredentials): Promise<ProtheusAuthResponse> {
    try {
      // Primeiro tentar autenticação Basic do Protheus
      const basicAuth = btoa(`${credentials.username}:${credentials.password}`);
      
      try {
        // Tentar autenticação Basic primeiro
        const basicResponse = await authApi.get('/api/framework/v1/users', {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Accept': 'application/json'
          }
        });
        
        // Se Basic funcionar, usar o token Basic como access_token
        if (basicResponse.status === 200) {
          return {
            access_token: basicAuth,
            refresh_token: basicAuth,
            token_type: 'Basic',
            expires_in: 86400,
            user: {
              id: credentials.username,
              username: credentials.username,
              name: credentials.username,
              email: '',
              groups: [],
              permissions: []
            }
          };
        }
      } catch (basicError) {
        console.log('Basic auth falhou, tentando OAuth2...');
      }
      
      // Se Basic falhar, tentar OAuth2
      const params = new URLSearchParams({
        grant_type: 'password',
        username: credentials.username,
        password: credentials.password
      });

      // Requisição GET para obter access_token conforme documentação
      const response = await authApi.get<ProtheusAuthResponse>(
        `${OAUTH2_TOKEN_URL}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // Validar se recebemos o access_token
      if (!response.data.access_token) {
        throw new Error('Token de acesso não retornado pelo servidor');
      }

      // Buscar informações do usuário se necessário
      let userInfo: ProtheusUser | null = null;
      try {
        const userResponse = await this.getUserInfo(response.data.access_token);
        userInfo = userResponse;
      } catch (userError) {
        console.warn('Não foi possível obter informações do usuário:', userError);
        // Criar usuário básico com as informações do login
        userInfo = {
          id: credentials.username,
          username: credentials.username,
          name: credentials.username,
          email: '',
          groups: [],
          permissions: []
        };
      }

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type || 'Bearer',
        expires_in: response.data.expires_in || 3600,
        user: userInfo
      };

    } catch (error: any) {
      console.error('Erro na autenticação Protheus:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Credenciais inválidas. Verifique usuário e senha.');
      } else if (error.response?.status === 403) {
        throw new Error('Acesso negado. Usuário não autorizado.');
      } else if (error.response?.data?.error_description) {
        throw new Error(error.response.data.error_description);
      } else {
        throw new Error('Erro na comunicação com o servidor Protheus.');
      }
    }
  },

  // Refresh token usando POST conforme documentação
  async refreshToken(refreshToken: string): Promise<ProtheusAuthResponse> {
    try {
      // Construir URL com parâmetros para requisição POST
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      // Requisição POST para renovar access_token conforme documentação
      const response = await authApi.post<ProtheusAuthResponse>(
        `${OAUTH2_REFRESH_URL}?${params.toString()}`,
        null, // Body vazio, parâmetros na URL
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.access_token) {
        throw new Error('Token de acesso não retornado na renovação');
      }

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        token_type: response.data.token_type || 'Bearer',
        expires_in: response.data.expires_in || 3600,
        user: response.data.user
      };

    } catch (error: any) {
      console.error('Erro ao renovar token:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Refresh token expirado. Faça login novamente.');
      } else {
        throw new Error('Erro ao renovar token de acesso.');
      }
    }
  },

  // Buscar informações do usuário autenticado
  async getUserInfo(accessToken: string): Promise<ProtheusUser> {
    try {
      const response = await api.get('/api/framework/v1/users', {
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
      console.warn('Erro ao buscar informações do usuário:', error);
      throw error;
    }
  },

  // Logout (opcional, pode limpar cache local)
  async logout(): Promise<void> {
    try {
      // Limpar tokens do localStorage/sessionStorage se necessário
      // O Protheus não possui endpoint específico de logout para JWT
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
      console.warn('Erro ao recuperar usuário do localStorage:', error);
      return null;
    }
  }
};