import { backendApi } from './api';

// Types for Protheus data search
export interface SearchFilter {
  field: string;
  operator: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne';
  value: string | number;
}

export interface SearchRecordsParams {
  tableName: string;
  filters?: SearchFilter[];
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  data: Record<string, any>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchableField {
  fieldName: string;
  label: string;
  type: 'string' | 'number' | 'date';
  size?: number;
}

export interface ProtheusRecord {
  R_E_C_N_O_: string;
  [key: string]: any;
}

export const protheusDataService = {
  /**
   * Search records in Protheus table with filters
   */
  async searchRecords(params: SearchRecordsParams): Promise<SearchResult> {
    const response = await backendApi.post('/protheus-data/search', params);
    return response.data;
  },

  /**
   * Get a single record by RECNO
   */
  async getRecordByRecno(tableName: string, recno: string): Promise<ProtheusRecord> {
    const response = await backendApi.get(`/protheus-data/record/${recno}`, {
      params: { tableName },
    });
    return response.data;
  },

  /**
   * Get searchable fields for a table (from template)
   */
  async getSearchableFields(templateId: string): Promise<SearchableField[]> {
    const response = await backendApi.get(`/protheus-data/searchable-fields/${templateId}`);
    return response.data;
  },

  /**
   * Create alteration draft
   */
  async createAlterationDraft(data: {
    templateId: string;
    originalRecno: string;
    formData?: Record<string, any>;
  }): Promise<any> {
    const response = await backendApi.post('/registrations/alteration', data);
    return response.data;
  },
};
