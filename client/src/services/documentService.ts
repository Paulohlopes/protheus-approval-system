import api from './api';
import axios from 'axios';
import { config } from '../config/environment';

// Criar interceptor para debug de headers
const debugAxios = axios.create();
debugAxios.interceptors.request.use((config) => {
  const requestId = config.headers?.['X-Request-Id'] || 'unknown';
  console.log(`🔍 INTERCEPTOR [${requestId}] - Request being sent:`);
  console.log('   URL:', config.url);
  console.log('   Method:', config.method?.toUpperCase());
  console.log('   Headers:', JSON.stringify(config.headers, null, 2));
  console.log('   TenantId specifically:', JSON.stringify(config.headers?.['TenantId']));
  return config;
});

debugAxios.interceptors.response.use(
  (response) => {
    console.log('✅ INTERCEPTOR - Response received:', response.status);
    return response;
  },
  (error) => {
    console.log('❌ INTERCEPTOR - Error response:');
    console.log('   Status:', error.response?.status);
    console.log('   Data:', error.response?.data);
    return Promise.reject(error);
  }
);
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
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        timeout: 30000
      });
      
      console.log('documentService.getDocuments - Response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else if (error.response?.status === 403) {
          throw new Error('Sem permissão para acessar documentos.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Erro ao buscar documentos.');
        }
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
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else if (error.response?.status === 403) {
          throw new Error('Sem permissão para acessar este documento.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Erro ao buscar documento.');
        }
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

      // TESTE: Adicionar quebra de linha no final + identificador único
      const requestId = Math.random().toString(36).substring(7);
      const tenantId = `01,${action.document.filial}\n`;
      console.log(`🚀 APROVAÇÃO [${requestId}] - TenantId com \\n:`, JSON.stringify(tenantId));
      console.log(`🚀 APROVAÇÃO [${requestId}] - Documento: ${action.document.numero}`);
      
      // Create Basic Auth header
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
      
      const apiUrl = `http://brsvawssaa06069:8029/rest/aprova_documento`;
      
      console.log('Calling approval API with axios:', {
        url: apiUrl,
        tenantId,
        body: requestBody,
        currentApprover: currentApprover,
        userEmail: userEmail
      });

      try {
        const response = await debugAxios.post(apiUrl, requestBody, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'TenantId': tenantId,
            'X-Request-Id': requestId
          },
          timeout: 30000,
          validateStatus: () => true // Para podermos tratar erros manualmente
        });

        console.log('DEBUG APROVAÇÃO - Response status:', response.status);
        console.log('DEBUG APROVAÇÃO - Response headers:', response.headers);

        if (response.status !== 200 && response.status !== 201) {
          console.log('Approval API Error Response:', response.data);
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'} - ${JSON.stringify(response.data)}`);
        }

        console.log('Approval API response:', response.data);
        const data = response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            headers: error.config?.headers
          });
          throw error;
        }
        throw error;
      }
      
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

      // TESTE: Adicionar quebra de linha no final como sugerido
      const tenantId = `01,${action.document.filial}\n`;
      console.log('DEBUG REJEIÇÃO - TenantId com \\n:', JSON.stringify(tenantId));
      
      // Create Basic Auth header
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
      
      const apiUrl = `http://brsvawssaa06069:8029/rest/aprova_documento`;
      
      console.log('Calling rejection API with axios:', {
        url: apiUrl,
        tenantId,
        body: requestBody
      });

      try {
        const response = await debugAxios.post(apiUrl, requestBody, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'TenantId': tenantId,
            'X-Request-Id': requestId
          },
          timeout: 30000,
          validateStatus: () => true // Para podermos tratar erros manualmente
        });

        console.log('DEBUG REJEIÇÃO - Response status:', response.status);
        console.log('DEBUG REJEIÇÃO - Response headers:', response.headers);

        if (response.status !== 200 && response.status !== 201) {
          console.log('Rejection API Error Response:', response.data);
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'} - ${JSON.stringify(response.data)}`);
        }

        console.log('Rejection API response:', response.data);
        const data = response.data;
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            headers: error.config?.headers
          });
          throw error;
        }
        throw error;
      }
      
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