import api from './api';
import type { 
  ProtheusDocument, 
  DocumentFilters, 
  PaginationParams, 
  ApprovalAction, 
  DashboardStats,
  ApiResponse 
} from '../types/auth';

export const documentService = {
  // Get documents with filters and pagination
  async getDocuments(
    filters: DocumentFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ApiResponse<ProtheusDocument[]>> {
    try {
      const params = new URLSearchParams();
      
      // Add pagination params
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (pagination.sortBy) {
        params.append('sortBy', pagination.sortBy);
      }
      if (pagination.sortOrder) {
        params.append('sortOrder', pagination.sortOrder);
      }
      
      // Add filter params
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.priority) {
        params.append('priority', filters.priority);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.requester) {
        params.append('requester', filters.requester);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      console.log('Fetching documents from Protheus...', params.toString());
      
      const response = await api.get<ApiResponse<ProtheusDocument[]>>(`/api/documents?${params}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch documents');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para acessar documentos.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao buscar documentos.');
      }
    }
  },

  // Get single document by ID
  async getDocument(id: string): Promise<ProtheusDocument> {
    try {
      console.log('Fetching document from Protheus:', id);
      
      const response = await api.get<{ data: ProtheusDocument }>(`/api/documents/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching document:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Documento não encontrado.');
      } else if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para acessar este documento.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao buscar documento.');
      }
    }
  },

  // Approve or reject document
  async processDocument(
    documentId: string, 
    action: ApprovalAction, 
    comments?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        action,
        comments,
        timestamp: new Date().toISOString()
      };

      console.log('Processing document in Protheus:', documentId, action);
      
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/documents/${documentId}/process`, 
        payload
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error processing document:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para processar este documento.');
      } else if (error.response?.status === 404) {
        throw new Error('Documento não encontrado.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} documento.`);
      }
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Fetching dashboard stats from Protheus...');
      
      const response = await api.get<{ data: DashboardStats }>('/api/dashboard/stats');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para acessar estatísticas do dashboard.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao buscar estatísticas do dashboard.');
      }
    }
  }
};