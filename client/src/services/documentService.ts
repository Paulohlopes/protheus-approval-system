import api from './api';
import type { 
  ProtheusDocument, 
  DocumentFilters, 
  PaginationParams, 
  ApprovalAction, 
  DashboardStats,
  ApiResponse 
} from '../types/auth';

// Mock data generation helpers
const generateMockDocument = (id?: string): ProtheusDocument => {
  const types = ['purchase_order', 'invoice', 'expense_report', 'contract'];
  const statuses: ProtheusDocument['status'][] = ['pending', 'approved', 'rejected'];
  const priorities: ProtheusDocument['priority'][] = ['low', 'medium', 'high', 'urgent'];
  
  const randomId = id || Math.random().toString(36).substr(2, 9);
  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
  
  return {
    id: randomId,
    type: randomType,
    number: `${randomType.toUpperCase()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    series: 'A',
    description: `${randomType.replace('_', ' ')} description for ${randomId}`,
    value: Math.floor(Math.random() * 100000) + 1000,
    currency: 'BRL',
    requestDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    dueDate: new Date(Date.now() + Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)).toISOString(),
    requester: {
      id: `user_${Math.floor(Math.random() * 100)}`,
      name: `User ${Math.floor(Math.random() * 100)}`,
      department: 'Purchasing',
    },
    status: randomStatus,
    priority: randomPriority,
    comments: Math.random() > 0.5 ? 'Sample comment' : undefined,
  };
};

const generateMockDocuments = (count: number = 10): ProtheusDocument[] => {
  return Array.from({ length: count }, () => generateMockDocument());
};

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

      // Real API call (comment out for mock)
      // const response = await api.get(`/documents?${params}`);
      // return response.data;
      
      // Mock implementation with realistic delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockDocuments = generateMockDocuments(pagination.limit);
      
      return {
        success: true,
        data: mockDocuments,
        message: 'Documents retrieved successfully',
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 50, // Mock total
          totalPages: Math.ceil(50 / pagination.limit)
        }
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar documentos.'
      );
    }
  },

  // Get single document by ID
  async getDocument(id: string): Promise<ProtheusDocument> {
    try {
      // Real API call (comment out for mock)
      // const response = await api.get(`/documents/${id}`);
      // return response.data.data;
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockDocument(id);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar documento.'
      );
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

      // Real API call (comment out for mock)
      // const response = await api.post(`/documents/${documentId}/process`, payload);
      // return response.data;
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Documento ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.`
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} documento.`
      );
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Real API call (comment out for mock)
      // const response = await api.get('/dashboard/stats');
      // return response.data.data;
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        totalPending: 15,
        totalApproved: 125,
        totalRejected: 8,
        highPriority: 3,
        expiringSoon: 5,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Erro ao buscar estatísticas do dashboard.'
      );
    }
  }
};