import api from './api';
import type { 
  ProtheusDocument, 
  DocumentFilters, 
  PaginationParams, 
  ApprovalAction, 
  DashboardStats,
  ApiResponse,
  ProtheusApiResponse 
} from '../types/auth';

export const documentService = {
  // Get documents with filters and pagination
  async getDocuments(
    userEmail: string,
    filters: DocumentFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProtheusApiResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add user email as aprovador
      params.append('aprovador', userEmail);
      
      // Add pagination params if needed
      if (pagination.page) {
        params.append('page', pagination.page.toString());
      }
      if (pagination.limit) {
        params.append('limit', pagination.limit.toString());
      }
      
      if (pagination.sortBy) {
        params.append('sortBy', pagination.sortBy);
      }
      if (pagination.sortOrder) {
        params.append('sortOrder', pagination.sortOrder);
      }
      
      // Add filter params
      if (filters.status) {
        params.append('status', filters.status.join(','));
      }
      if (filters.type) {
        params.append('type', filters.type.join(','));
      }
      if (filters.priority) {
        params.append('priority', filters.priority.join(','));
      }
      if (filters.dateRange?.start) {
        params.append('dateFrom', filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        params.append('dateTo', filters.dateRange.end);
      }
      if (filters.requester) {
        params.append('requester', filters.requester);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      console.log('Fetching documents from Protheus...', params.toString());
      
      // Call the new Protheus API endpoint
      const response = await api.get<ProtheusApiResponse>(`http://brsvawssaa06069:8029/rest/DocAprov/documentos?${params}`);
      
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

  // Get single document by number
  async getDocument(numero: string, userEmail: string): Promise<ProtheusDocument | undefined> {
    try {
      console.log('Fetching document from Protheus:', numero);
      
      // Get all documents and find the specific one
      const response = await this.getDocuments(userEmail);
      const document = response.documentos.find(doc => doc.numero.trim() === numero.trim());
      
      if (!document) {
        throw new Error('Documento não encontrado.');
      }
      
      return document;
    } catch (error: any) {
      console.error('Error fetching document:', error);
      
      if (error.message === 'Documento não encontrado.') {
        throw error;
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

  // Approve document
  async approveDocument(
    action: ApprovalAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        documentId: action.documentId,
        action: 'approve',
        comments: action.comments,
        timestamp: new Date().toISOString()
      };

      console.log('Approving document in Protheus:', action.documentId);
      
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/documents/${action.documentId}/approve`, 
        payload
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error approving document:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para aprovar este documento.');
      } else if (error.response?.status === 404) {
        throw new Error('Documento não encontrado.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao aprovar documento.');
      }
    }
  },

  // Reject document
  async rejectDocument(
    action: ApprovalAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        documentId: action.documentId,
        action: 'reject',
        comments: action.comments,
        timestamp: new Date().toISOString()
      };

      console.log('Rejecting document in Protheus:', action.documentId);
      
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/documents/${action.documentId}/reject`, 
        payload
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para rejeitar este documento.');
      } else if (error.response?.status === 404) {
        throw new Error('Documento não encontrado.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao rejeitar documento.');
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