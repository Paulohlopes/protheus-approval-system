/**
 * Utilitário para formatação de datas vindas do Protheus
 */

/**
 * Formata uma data do Protheus (YYYYMMDD) para formato brasileiro (DD/MM/YYYY)
 * @param dateString - Data no formato YYYYMMDD ou DD/MM/YYYY
 * @returns Data formatada como DD/MM/YYYY ou string vazia se inválida
 */
export const formatProtheusDate = (dateString: string): string => {
  if (!dateString || dateString === '0' || dateString === '00000000') return '';
  
  try {
    // Se for formato YYYYMMDD (8 dígitos)
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      
      // Validar se são números válidos
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      if (yearNum > 1900 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        // Verificar se a data é realmente válida usando o objeto Date
        const dateObj = new Date(yearNum, monthNum - 1, dayNum);
        if (dateObj.getFullYear() === yearNum && 
            dateObj.getMonth() === monthNum - 1 && 
            dateObj.getDate() === dayNum) {
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }
    }
    
    // Se já estiver em formato DD/MM/YYYY, verificar se é válido
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (yearNum > 1900 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          // Verificar se a data é realmente válida
          const dateObj = new Date(yearNum, monthNum - 1, dayNum);
          if (dateObj.getFullYear() === yearNum && 
              dateObj.getMonth() === monthNum - 1 && 
              dateObj.getDate() === dayNum) {
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
          }
        }
      }
    }
    
    return '';
  } catch {
    return '';
  }
};

/**
 * Converte uma data brasileira (DD/MM/YYYY) para objeto Date
 * @param dateString - Data no formato DD/MM/YYYY
 * @returns Objeto Date ou null se inválida
 */
export const parseProtheusDate = (dateString: string): Date | null => {
  const formatted = formatProtheusDate(dateString);
  if (!formatted) return null;
  
  const [day, month, year] = formatted.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formata uma data para exibição com nome do mês
 * @param dateString - Data no formato YYYYMMDD ou DD/MM/YYYY
 * @returns Data formatada como "DD de MMM de YYYY" ou string vazia
 */
export const formatProtheusDateLong = (dateString: string): string => {
  const dateObj = parseProtheusDate(dateString);
  if (!dateObj) return '';
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calcula a diferença em dias entre uma data e hoje
 * @param dateString - Data no formato YYYYMMDD ou DD/MM/YYYY
 * @returns Número de dias (positivo = futuro, negativo = passado)
 */
export const daysDifference = (dateString: string): number | null => {
  const dateObj = parseProtheusDate(dateString);
  if (!dateObj) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  
  const diffTime = dateObj.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};