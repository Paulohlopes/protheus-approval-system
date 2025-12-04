import api from './api';
import type {
  LookupConfig,
  LookupSearchResponse,
  LookupRecordResponse,
} from '../types/registration';

export const lookupService = {
  /**
   * Search records for lookup modal
   */
  async search(
    config: LookupConfig,
    searchTerm: string,
    pagination: { page: number; limit: number }
  ): Promise<LookupSearchResponse> {
    const response = await api.post('/form-templates/lookup/search', {
      config,
      search: searchTerm,
      page: pagination.page,
      limit: pagination.limit,
    });
    return response.data;
  },

  /**
   * Get a single record by value
   */
  async getRecord(config: LookupConfig, value: string): Promise<LookupRecordResponse> {
    const response = await api.post('/form-templates/lookup/record', {
      config,
      value,
    });
    return response.data;
  },

  /**
   * Validate a lookup value
   */
  async validateValue(
    config: LookupConfig,
    value: string
  ): Promise<{ valid: boolean; message?: string }> {
    const response = await api.post('/form-templates/lookup/validate', {
      config,
      value,
    });
    return response.data;
  },

  /**
   * Get allowed tables for lookup
   */
  async getAllowedTables(): Promise<string[]> {
    const response = await api.get('/form-templates/lookup/allowed-tables');
    return response.data;
  },
};
