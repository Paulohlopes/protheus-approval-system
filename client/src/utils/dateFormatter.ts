/**
 * Utilitário para formatação de datas vindas do Protheus
 */

/**
 * Formata uma data do Protheus mantendo como string
 * @param dateString - Data no formato que vem da API (ex: 2020-1-28, YYYYMMDD, etc)
 * @returns Data como string ou vazia se inválida
 */
export const formatProtheusDate = (dateString: string): string => {
  if (!dateString || dateString === '0' || dateString === '00000000') return '';
  
  // Retornar a data como string, apenas limpando valores inválidos
  return dateString;
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