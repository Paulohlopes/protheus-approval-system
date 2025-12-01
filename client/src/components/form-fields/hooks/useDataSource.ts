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
  warning: string | null;
  duplicateCount: number;
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
  const [warning, setWarning] = useState<string | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const fetchOptions = useCallback(
    async (filters?: Record<string, string>): Promise<DataSourceOption[]> => {
      // If fixed options, return directly from config
      if (dataSourceType === 'fixed' && dataSourceConfig?.fixedOptions) {
        const fixedOptions = dataSourceConfig.fixedOptions;
        setOptions(fixedOptions);
        setWarning(null);
        setDuplicateCount(0);
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
        setOptions(result.options);
        setWarning(result.warning || null);
        setDuplicateCount(result.duplicateCount || 0);

        // Log warning to console for developers
        if (result.warning) {
          console.warn(`[DataSource] ${result.warning}`);
        }

        return result.options;
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
    setWarning(null);
    setDuplicateCount(0);
  }, []);

  return {
    options,
    loading,
    error,
    warning,
    duplicateCount,
    fetchOptions,
    clearOptions,
  };
}
