const os = require('os');
const { execSync } = require('child_process');

class WindowsInfoService {
  /**
   * Captura informações do usuário Windows atual
   */
  static getCurrentWindowsUser() {
    try {
      const userInfo = {
        // Informações do OS
        username: os.userInfo().username,
        homedir: os.userInfo().homedir,
        hostname: os.hostname(),
        platform: os.platform(),
        
        // Informações adicionais
        domain: process.env.USERDOMAIN || '',
        computerName: process.env.COMPUTERNAME || os.hostname(),
        fullUsername: process.env.USERNAME || os.userInfo().username,
        
        // Tentar capturar email e nome completo do Active Directory
        email: '',
        fullName: '',
        department: '',
        title: ''
      };

      // Se estiver no Windows, tentar capturar mais informações
      if (os.platform() === 'win32') {
        try {
          // Tentar capturar nome completo via PowerShell (mais moderno que wmic)
          try {
            const fullNameCmd = `powershell -Command "Get-LocalUser -Name '${userInfo.username}' | Select-Object -ExpandProperty FullName"`;
            const fullNameResult = execSync(fullNameCmd, { encoding: 'utf8', timeout: 3000 });
            if (fullNameResult.trim()) {
              userInfo.fullName = fullNameResult.trim();
            }
          } catch (psError) {
            console.log('PowerShell Get-LocalUser não disponível');
          }

          // Tentar capturar informações do Active Directory (se disponível)
          try {
            const adCmd = `powershell -Command "Get-ADUser -Identity ${userInfo.username} -Properties EmailAddress, Department, Title | Select-Object EmailAddress, Department, Title | ConvertTo-Json"`;
            const adResult = execSync(adCmd, { encoding: 'utf8', timeout: 3000 });
            const adData = JSON.parse(adResult);
            
            userInfo.email = adData.EmailAddress || '';
            userInfo.department = adData.Department || '';
            userInfo.title = adData.Title || '';
          } catch (adError) {
            // Active Directory não disponível ou sem permissões
            console.log('Active Directory não disponível');
          }

          // Alternativa: tentar capturar email do registro do Windows
          if (!userInfo.email) {
            try {
              const regCmd = 'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Office\\16.0\\Common\\Identity" /v ADUserEmail';
              const regResult = execSync(regCmd, { encoding: 'utf8', timeout: 3000 });
              const emailMatch = regResult.match(/ADUserEmail\s+REG_SZ\s+(.+)/);
              if (emailMatch) {
                userInfo.email = emailMatch[1].trim();
              }
            } catch (regError) {
              // Registro não encontrado
              console.log('Registro Office não encontrado');
            }
          }

          // Tentar capturar do Outlook se estiver instalado
          if (!userInfo.email) {
            try {
              const outlookCmd = 'powershell -Command "$outlook = New-Object -ComObject Outlook.Application; $outlook.Session.CurrentUser.Address"';
              const outlookResult = execSync(outlookCmd, { encoding: 'utf8', timeout: 5000 }).trim();
              if (outlookResult) {
                userInfo.email = outlookResult;
              }
            } catch (outlookError) {
              // Outlook não disponível
              console.log('Outlook não disponível');
            }
          }

        } catch (error) {
          console.error('Erro ao capturar informações adicionais do Windows:', error.message);
        }
      }

      // Construir email padrão se não encontrado
      if (!userInfo.email && userInfo.domain) {
        // Padrão comum em empresas: nome.sobrenome@empresa.com.br
        userInfo.email = `${userInfo.username}@${userInfo.domain.toLowerCase()}.com.br`;
      }

      return userInfo;
    } catch (error) {
      console.error('Erro ao capturar informações do usuário Windows:', error);
      return null;
    }
  }

  /**
   * Valida se o usuário Windows corresponde ao usuário do Protheus
   */
  static validateWindowsUser(windowsUsername, protheusUsername) {
    // Normalizar usernames (remover domínio, converter para minúscula)
    const normalizeUsername = (username) => {
      return username
        .toLowerCase()
        .replace(/^.*\\/, '') // Remove domínio se presente
        .trim();
    };

    const normalizedWindows = normalizeUsername(windowsUsername);
    const normalizedProtheus = normalizeUsername(protheusUsername);

    return normalizedWindows === normalizedProtheus;
  }

  /**
   * Sugere configurações baseadas no ambiente Windows
   */
  static getSuggestedSettings() {
    const userInfo = this.getCurrentWindowsUser();
    if (!userInfo) return null;

    return {
      username: userInfo.username,
      email: userInfo.email,
      fullName: userInfo.fullName,
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'pt-BR'
    };
  }
}

module.exports = WindowsInfoService;