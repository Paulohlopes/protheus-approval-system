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

  // Usar apenas as informações do cliente (sem servidor local)
  const [isLoading] = useState(false);
  const [error] = useState(null);
  
  // Simular configurações sugeridas baseadas no cliente
  const suggestedSettings = localWindowsInfo ? {
    username: localWindowsInfo.username,
    email: localWindowsInfo.email,
    fullName: localWindowsInfo.fullName,
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'pt-BR'
  } : null;

  // Usar apenas informações locais
  const windowsInfo = localWindowsInfo;

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
    if (!windowsInfo?.username) return false;
    
    // Normalizar usernames (remover domínio, converter para minúscula)
    const normalizeUsername = (username: string) => {
      return username
        .toLowerCase()
        .replace(/^.*\\/, '') // Remove domínio se presente
        .trim();
    };

    const normalizedWindows = normalizeUsername(windowsInfo.username);
    const normalizedProtheus = normalizeUsername(protheusUsername);

    return normalizedWindows === normalizedProtheus;
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