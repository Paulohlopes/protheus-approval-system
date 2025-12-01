import { useState, useCallback } from 'react';
import { dataSourceService } from '../../../services/dataSourceService';
import type { DataSourceOption, DataSourceType, DataSourceConfig } from '../../../types/registration';

interface UseDataSourceOptions {
  templateId?: string;
  fieldId?: string;
  dataSourceType?: DataSourceType;
  dataSourceConfig?: DataSourceConfig;
}

interface UseDataSourceResult {
  options: DataSourceOption[];
  loading: boolean;
  error: string | null;
  fetchOptions: (filters?: Record<string, string>) => Promise<DataSourceOption[]>;
  clearOptions: () => void;
}

export function useDataSource({
  templateId,
  fieldId,
  dataSourceType,
  dataSourceConfig,
}: UseDataSourceOptions): UseDataSourceResult {
  const [options, setOptions] = useState<DataSourceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(
    async (filters?: Record<string, string>): Promise<DataSourceOption[]> => {
      // If fixed options, return directly from config
      if (dataSourceType === 'fixed' && dataSourceConfig?.fixedOptions) {
        const fixedOptions = dataSourceConfig.fixedOptions;
        setOptions(fixedOptions);
        return fixedOptions;
      }

      // Need templateId and fieldId for dynamic data sources
      if (!templateId || !fieldId) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const result = await dataSourceService.getFieldOptions(
          templateId,
          fieldId,
          filters,
        );
        setOptions(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar opções';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [templateId, fieldId, dataSourceType, dataSourceConfig],
  );

  const clearOptions = useCallback(() => {
    setOptions([]);
    setError(null);
  }, []);

  return {
    options,
    loading,
    error,
    fetchOptions,
    clearOptions,
  };
}
