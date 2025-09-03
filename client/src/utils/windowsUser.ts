/**
 * Utilitário para capturar informações do usuário Windows
 */

export interface WindowsUserInfo {
  username: string;
  domain: string;
  fullName?: string;
  email?: string;
  language: string;
  timezone: string;
  computerName?: string;
}

/**
 * Captura informações básicas do usuário Windows
 * Simples e funcional apenas no navegador
 */
export const getWindowsUserInfo = (): WindowsUserInfo | null => {
  try {
    // Tentar capturar username salvo anteriormente
    let username = localStorage.getItem('windows-username') || '';
    
    // Se não temos username salvo, retornar informações básicas do sistema
    if (!username) {
      // Detectar se é Windows pelo user agent
      const isWindows = navigator.userAgent.includes('Windows');
      if (isWindows) {
        // Para demonstração, vamos usar um usuário padrão
        // Em produção, isso seria capturado de forma mais sofisticada
        username = 'paulo'; // Pode ser configurável ou solicitado ao usuário
      }
    }
    
    if (!username) return null;
    
    const userInfo: WindowsUserInfo = {
      username: username,
      domain: 'PHL', // Domínio padrão da empresa
      email: `${username}@phl.com.br`,
      language: navigator.language || 'pt-BR',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      computerName: 'WorkStation'
    };
    
    return userInfo;
    
  } catch (error) {
    console.error('Erro ao capturar informações do Windows:', error);
    return null;
  }
};

/**
 * Salva o username para uso futuro
 */
export const saveWindowsUsername = (username: string) => {
  try {
    localStorage.setItem('windows-username', username);
    localStorage.setItem('last-login-username', username);
    localStorage.setItem('last-login-date', new Date().toISOString());
  } catch (error) {
    console.error('Erro ao salvar username:', error);
  }
};

/**
 * Recupera o último username usado
 */
export const getLastUsername = (): string | null => {
  try {
    return localStorage.getItem('last-login-username');
  } catch (error) {
    return null;
  }
};

/**
 * Tenta detectar se está em ambiente corporativo Windows
 */
export const isWindowsCorporateEnvironment = (): boolean => {
  // Verificar se está em domínio corporativo comum
  const corporateDomains = ['CORP', 'AD', 'DOMAIN', 'LOCAL'];
  const hostname = window.location.hostname.toUpperCase();
  
  return corporateDomains.some(domain => hostname.includes(domain)) ||
         hostname.includes('INTRANET') ||
         hostname.startsWith('10.') ||
         hostname.startsWith('192.168.') ||
         hostname.startsWith('172.');
};

/**
 * Sugere username baseado em padrões comuns corporativos
 */
export const suggestUsername = (): string => {
  const lastUsername = getLastUsername();
  if (lastUsername) {
    return lastUsername;
  }
  
  // Tentar capturar do email se disponível
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
  if (emailInput?.value) {
    return emailInput.value.split('@')[0];
  }
  
  return '';
};