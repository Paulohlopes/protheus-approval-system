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
 * Captura informações do usuário Windows através do navegador
 */
export const getWindowsUserInfo = (): WindowsUserInfo | null => {
  try {
    // Tentar capturar username através de diferentes métodos
    let username = '';
    let domain = '';
    
    // Método 1: Através de ActiveX (apenas IE/Edge antigo com permissões especiais)
    if ((window as any).ActiveXObject) {
      try {
        const network = new (window as any).ActiveXObject('WScript.Network');
        username = network.UserName;
        domain = network.UserDomain;
      } catch (e) {
        console.log('ActiveX não disponível');
      }
    }
    
    // Método 2: Através da URL se estiver usando autenticação Windows integrada
    if (!username && window.location.href.includes('@')) {
      const match = window.location.href.match(/\/\/(.+?)@/);
      if (match) {
        username = match[1].split(':')[0];
      }
    }
    
    // Método 3: Tentar capturar do localStorage se já foi salvo antes
    if (!username) {
      const savedUser = localStorage.getItem('windows-username');
      if (savedUser) {
        username = savedUser;
      }
    }
    
    // Método 4: Tentar capturar email do localStorage ou cookies
    let email = '';
    const savedEmail = localStorage.getItem('user-email');
    if (savedEmail) {
      email = savedEmail;
    }
    
    // Método 5: Capturar informações do navegador/sistema
    const userInfo: WindowsUserInfo = {
      username: username || '',
      domain: domain || '',
      email: email || (username ? `${username}@phl.com.br` : ''), // Email padrão baseado no username
      language: navigator.language || 'pt-BR',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      computerName: ''
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