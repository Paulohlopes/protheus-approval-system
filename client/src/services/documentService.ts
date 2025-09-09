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

  // Approve document
  async approveDocument(
    action: ApprovalAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Approving document:', action.documentId);
      
      if (!action.document) {
        throw new Error('Documento não encontrado para aprovação');
      }

      // Encontrar o aprovador atual da alçada
      const userEmail = action.approverId; // Assumindo que o approverId é o email do usuário
      const currentApprover = action.document.alcada.find(nivel => 
        nivel.CIDENTIFICADOR === userEmail?.split('@')[0] ||
        nivel.CNOME === userEmail?.split('@')[0]
      );

      if (!currentApprover) {
        console.log('Available approvers in alcada:', action.document.alcada);
        console.log('Looking for user:', userEmail, 'split:', userEmail?.split('@')[0]);
        throw new Error('Aprovador não encontrado na alçada do documento');
      }

      const requestBody = {
        TIPO: action.document.tipo,
        DOCUMENTO: action.document.numero.trim(),
        APROVADOR: currentApprover.aprovador_aprov,
        STATUS: 'APROVACAO',
        OBSERVACAO: action.comments || ''
      };

      // Usar o formato sem aspas, como confirmado pelo usuário
      const tenantId = `01,${action.document.filial}`;
      console.log('DEBUG APROVAÇÃO - TenantId sendo enviado:', tenantId);
      
      // Create Basic Auth header
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
      
      const apiUrl = `http://brsvawssaa06069:8029/rest/aprova_documento`;
      
      console.log('Calling approval API:', {
        url: apiUrl,
        tenantId,
        body: requestBody,
        currentApprover: currentApprover,
        userEmail: userEmail
      });

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'TenantId': tenantId
      };
      
      console.log('DEBUG APROVAÇÃO - Headers completos:', headers);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('Approval API Error Response:', errorData);
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch {
          console.log('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Approval API response:', data);
      
      return {
        success: true,
        message: `Documento ${action.documentId} aprovado com sucesso`
      };
    } catch (error: any) {
      console.error('Error approving document:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão com o servidor. Verifique a conectividade de rede.');
      } else if (error.name === 'TimeoutError') {
        throw new Error('Timeout na requisição. O servidor pode estar sobrecarregado.');
      } else if (error.message?.includes('CONNECTION_RESET')) {
        throw new Error('Conexão resetada pelo servidor. Tente novamente.');
      } else {
        throw new Error(error.message || 'Erro ao aprovar documento.');
      }
    }
  },

  // Reject document
  async rejectDocument(
    action: ApprovalAction
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Rejecting document:', action.documentId);
      
      if (!action.document) {
        throw new Error('Documento não encontrado para rejeição');
      }

      // Encontrar o aprovador atual da alçada
      const userEmail = action.approverId; // Assumindo que o approverId é o email do usuário
      const currentApprover = action.document.alcada.find(nivel => 
        nivel.CIDENTIFICADOR === userEmail?.split('@')[0] ||
        nivel.CNOME === userEmail?.split('@')[0]
      );

      if (!currentApprover) {
        console.log('Available approvers in alcada:', action.document.alcada);
        console.log('Looking for user:', userEmail, 'split:', userEmail?.split('@')[0]);
        throw new Error('Aprovador não encontrado na alçada do documento');
      }

      const requestBody = {
        TIPO: action.document.tipo,
        DOCUMENTO: action.document.numero.trim(),
        APROVADOR: currentApprover.aprovador_aprov,
        STATUS: 'REJEICAO',
        OBSERVACAO: action.comments || 'Rejeitado pelo aprovador'
      };

      // Usar o formato sem aspas, como confirmado pelo usuário
      const tenantId = `01,${action.document.filial}`;
      
      // Create Basic Auth header
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
      
      const apiUrl = `http://brsvawssaa06069:8029/rest/aprova_documento`;
      
      console.log('Calling rejection API:', {
        url: apiUrl,
        tenantId,
        body: requestBody
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'TenantId': tenantId
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('Rejection API Error Response:', errorData);
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch {
          console.log('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Rejection API response:', data);
      
      return {
        success: true,
        message: `Documento ${action.documentId} rejeitado com sucesso`
      };
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão com o servidor. Verifique a conectividade de rede.');
      } else if (error.name === 'TimeoutError') {
        throw new Error('Timeout na requisição. O servidor pode estar sobrecarregado.');
      } else if (error.message?.includes('CONNECTION_RESET')) {
        throw new Error('Conexão resetada pelo servidor. Tente novamente.');
      } else {
        throw new Error(error.message || 'Erro ao rejeitar documento.');
      }
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