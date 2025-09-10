import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: string): string => {
  if (!value || typeof value !== 'string') {
    return 'R$ 0,00';
  }
  
  const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

export const formatDate = (date: string): string => {
  // Date comes in format YYYYMMDD, convert to DD/MM/YYYY
  if (date.length === 8) {
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  
  // If date is already formatted or in another format
  if (date.includes('/')) {
    return date;
  }
  
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return date;
  }
};