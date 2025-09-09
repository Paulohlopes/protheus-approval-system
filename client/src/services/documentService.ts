import api from './api';
import { config } from '../config/environment';
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
      
      // Add the aprovador filter - required parameter
      params.append('aprovador', userEmail);
      
      // Add numero filter if provided
      if (filters.numero) {
        params.append('numero', filters.numero);
      }
      
      // Add search filter if provided (for compatibility)
      if (filters.search && !filters.numero) {
        // Se search for um número (apenas dígitos), usar como numero
        const searchValue = filters.search.trim();
        if (/^\d+$/.test(searchValue)) {
          params.append('numero', searchValue);
        } else {
          params.append('search', filters.search);
        }
      }

      console.log('documentService.getDocuments - Filters received:', filters);
      console.log('documentService.getDocuments - URL params:', params.toString());
      
      // Call the new Protheus API endpoint with Basic Auth
      const apiUrl = `http://brsvawssaa06069:8029/rest/DocAprov/documentos?${params.toString()}`;
      console.log('documentService.getDocuments - Making authenticated API call to:', apiUrl);
      
      // Create Basic Auth header
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('documentService.getDocuments - Response:', data);
      
      return data;
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

  // Approve document - Mock implementation for now
  async approveDocument(
    action: ApprovalAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Mock approving document:', action.documentId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock success response
      return {
        success: true,
        message: `Documento ${action.documentId} aprovado com sucesso`
      };
    } catch (error: any) {
      console.error('Error approving document:', error);
      throw new Error('Erro ao aprovar documento.');
    }
  },

  // Reject document - Mock implementation for now
  async rejectDocument(
    action: ApprovalAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Mock rejecting document:', action.documentId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock success response
      return {
        success: true,
        message: `Documento ${action.documentId} rejeitado com sucesso`
      };
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      throw new Error('Erro ao rejeitar documento.');
    }
  },

  // Get dashboard statistics - Mock data for now
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Returning mock dashboard stats...');
      
      // Return mock data to avoid API errors
      return {
        totalPending: 5,
        totalApproved: 10,
        totalRejected: 2,
        highPriority: 3,
        expiringSoon: 1
      };
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Erro ao buscar estatísticas do dashboard.');
    }
  }
};