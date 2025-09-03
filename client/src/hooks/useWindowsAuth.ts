import { useState, useEffect } from 'react';
import { getWindowsUserInfo, saveWindowsUsername } from '../utils/windowsUser';

/**
 * Hook simples para capturar informações do usuário Windows
 */
export const useWindowsAuth = () => {
  const [windowsInfo, setWindowsInfo] = useState(() => getWindowsUserInfo());
  const isLoading = false;
  const error = null;

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
      email: windowsInfo.email || ''
    };
  };

  return {
    windowsInfo,
    isLoading,
    error,
    autoFillLogin,
    hasWindowsInfo: !!windowsInfo?.username
  };
};