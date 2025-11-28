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
  records: Array<{ recno: string; data: Record<string, any> }>;
  total: number;
  limit: number;
  offset: number;
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
   * Backend endpoint: GET /protheus-data/:tableName/search?filters=JSON&limit=N&offset=N
   */
  async searchRecords(params: SearchRecordsParams): Promise<SearchResult> {
    // Convert filters array to object format expected by backend
    const filtersObj: Record<string, string> = {};
    if (params.filters) {
      params.filters.forEach((f) => {
        if (f.field && f.value) {
          // Backend expects simple field:value format with LIKE by default
          // For more complex operators, we could encode them in the value
          filtersObj[f.field] = String(f.value);
        }
      });
    }

    const response = await backendApi.get(`/protheus-data/${params.tableName}/search`, {
      params: {
        filters: Object.keys(filtersObj).length > 0 ? JSON.stringify(filtersObj) : undefined,
        limit: params.pageSize || 50,
        offset: ((params.page || 1) - 1) * (params.pageSize || 50),
      },
    });
    return response.data;
  },

  /**
   * Get a single record by RECNO
   * Backend endpoint: GET /protheus-data/:tableName/record/:recno
   */
  async getRecordByRecno(tableName: string, recno: string): Promise<ProtheusRecord> {
    const response = await backendApi.get(`/protheus-data/${tableName}/record/${recno}`);
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
