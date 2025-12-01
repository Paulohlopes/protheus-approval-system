import { backendApi } from './api';
import type { DataSourceOption, DataSourceResponse } from '../types/registration';

export const dataSourceService = {
  /**
   * Get options for a field's data source
   */
  async getFieldOptions(
    templateId: string,
    fieldId: string,
    filters?: Record<string, string>,
  ): Promise<DataSourceResponse> {
    const response = await backendApi.get(
      `/form-templates/${templateId}/fields/${fieldId}/options`,
      { params: filters },
    );
    // Handle both old format (array) and new format (object with options)
    if (Array.isArray(response.data)) {
      return { options: response.data };
    }
    return response.data;
  },

  /**
   * Validate a field value using SQL validation
   */
  async validateFieldValue(
    templateId: string,
    fieldId: string,
    value: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const response = await backendApi.post(
      `/form-templates/${templateId}/fields/${fieldId}/validate`,
      { value },
    );
    return response.data;
  },

  /**
   * Get list of allowed tables for SQL queries
   */
  async getAllowedTables(): Promise<string[]> {
    const response = await backendApi.get('/form-templates/data-sources/allowed-tables');
    return response.data;
  },

  /**
   * Get available SX5 tables for selection
   */
  async getAvailableSx5Tables(): Promise<DataSourceOption[]> {
    const response = await backendApi.get('/form-templates/data-sources/sx5-tables');
    return response.data;
  },
};
