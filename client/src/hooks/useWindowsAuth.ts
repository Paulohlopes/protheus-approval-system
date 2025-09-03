import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getWindowsUserInfo, saveWindowsUsername } from '../utils/windowsUser';

// Create local server API instance for Windows info
const localApi = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

interface WindowsUserData {
  username: string;
  fullName?: string;
  email?: string;
  domain?: string;
  computerName?: string;
  department?: string;
  title?: string;
}

/**
 * Hook para capturar e usar informações do usuário Windows
 */
export const useWindowsAuth = () => {
  const [localWindowsInfo, setLocalWindowsInfo] = useState(() => getWindowsUserInfo());

  // Buscar informações do servidor local (mais confiável)
  const { data: serverWindowsInfo, isLoading, error } = useQuery({
    queryKey: ['windows-user'],
    queryFn: async (): Promise<WindowsUserData> => {
      const response = await localApi.get('/api/system/windows-user');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false
  });

  // Buscar configurações sugeridas
  const { data: suggestedSettings } = useQuery({
    queryKey: ['suggested-settings'],
    queryFn: async () => {
      const response = await localApi.get('/api/system/suggested-settings');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: false
  });

  // Combinar informações do cliente e servidor
  const windowsInfo = serverWindowsInfo || localWindowsInfo;

  // Salvar username quando disponível
  useEffect(() => {
    if (windowsInfo?.username) {
      saveWindowsUsername(windowsInfo.username);
    }
  }, [windowsInfo?.username]);

  /**
   * Preenche automaticamente o formulário de login
   */
  const autoFillLogin = () => {
    if (!windowsInfo) return null;

    return {
      username: windowsInfo.username || '',
      email: windowsInfo.email || '',
      fullName: windowsInfo.fullName || '',
      // Não retornamos a senha por segurança
    };
  };

  /**
   * Valida se o usuário Windows corresponde ao usuário Protheus
   */
  const validateWindowsUser = async (protheusUsername: string): Promise<boolean> => {
    try {
      const response = await localApi.post('/api/system/validate-windows-user', {
        protheusUsername
      });
      return response.data.data.isValid;
    } catch (error) {
      console.error('Erro ao validar usuário Windows:', error);
      return false;
    }
  };

  /**
   * Tenta fazer login automático se o usuário Windows for válido
   */
  const tryWindowsSSO = async () => {
    if (!windowsInfo?.username) return null;

    // Verificar se temos credenciais salvas para este usuário Windows
    const savedCredentials = localStorage.getItem(`sso-${windowsInfo.username}`);
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        // Descriptografar se necessário
        return credentials;
      } catch (error) {
        console.error('Erro ao recuperar credenciais SSO:', error);
      }
    }

    return null;
  };

  /**
   * Salva credenciais para SSO futuro (com consentimento do usuário)
   */
  const enableWindowsSSO = (username: string, encryptedPassword: string) => {
    if (!windowsInfo?.username) return;

    const ssoData = {
      username,
      // Senha deve ser criptografada antes de salvar
      password: encryptedPassword,
      windowsUser: windowsInfo.username,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(`sso-${windowsInfo.username}`, JSON.stringify(ssoData));
  };

  return {
    windowsInfo,
    isLoading,
    error,
    suggestedSettings,
    autoFillLogin,
    validateWindowsUser,
    tryWindowsSSO,
    enableWindowsSSO,
    hasWindowsInfo: !!windowsInfo?.username
  };
};