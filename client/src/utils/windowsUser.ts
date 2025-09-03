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
 * Captura informações reais do usuário Windows
 */
export const getWindowsUserInfo = (): WindowsUserInfo | null => {
  try {
    let username = '';
    let domain = '';
    
    // Método 1: Tentar capturar via ActiveX (funciona apenas no IE/Edge com configurações especiais)
    try {
      if ((window as any).ActiveXObject || 'ActiveXObject' in window) {
        const network = new (window as any).ActiveXObject('WScript.Network');
        username = network.UserName;
        domain = network.UserDomain;
        console.log('Usuário capturado via ActiveX:', username);
      }
    } catch (e) {
      console.log('ActiveX não disponível ou sem permissões');
    }
    
    // Método 2: Tentar capturar do ambiente do navegador (funciona em alguns casos)
    if (!username) {
      try {
        // Algumas variáveis que podem estar disponíveis
        const envUsername = (window as any).process?.env?.USERNAME || 
                           (window as any).process?.env?.USER ||
                           (window as any).USERNAME;
        if (envUsername) {
          username = envUsername;
        }
      } catch (e) {
        console.log('Variáveis de ambiente não disponíveis');
      }
    }
    
    // Método 3: Capturar de localStorage se já foi inserido manualmente
    if (!username) {
      username = localStorage.getItem('windows-username') || '';
      domain = localStorage.getItem('windows-domain') || '';
    }
    
    // Método 4: Solicitar ao usuário (fallback)
    if (!username) {
      const savedPrompt = localStorage.getItem('username-prompt-shown');
      if (!savedPrompt) {
        const userInput = prompt(
          'Para auto-preenchimento, digite seu nome de usuário Windows:',
          'paulo'
        );
        if (userInput) {
          username = userInput;
          localStorage.setItem('windows-username', username);
          localStorage.setItem('username-prompt-shown', 'true');
        }
      }
    }
    
    if (!username) return null;
    
    const userInfo: WindowsUserInfo = {
      username: username,
      domain: domain || 'PHL',
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