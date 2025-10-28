import api from './api';
import axios from 'axios';
import { config } from '../config/environment';
import { getAllApiConfigs, getApiConfigFor, type Country } from '../config/api-endpoints';
import { getErrorMessage } from '../utils/translationHelpers';

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
  ProtheusApiResponse,
  ApiError
} from '../types/auth';

export const documentService = {
  // Get documents with filters and pagination - from all active countries
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

      // Get all active country configurations
      const apiConfigs = getAllApiConfigs();
      console.log(`documentService.getDocuments - Fetching documents from ${apiConfigs.length} countries:`, apiConfigs.map(c => c.country).join(', '));

      // Fetch documents from all countries in parallel
      const promises = apiConfigs.map(async ({ country, config: countryConfig }) => {
        try {
          const apiUrl = `${countryConfig.baseUrl}${countryConfig.endpoints.docAprov}?${params.toString()}`;
          console.log(`documentService.getDocuments - [${country}] Making API call to:`, apiUrl);

          // Create Basic Auth header with country-specific credentials
          const credentials = btoa(`${countryConfig.auth.username}:${countryConfig.auth.password}`);

          const response = await axios.get(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Basic ${credentials}`
            },
            timeout: 30000
          });

          console.log(`documentService.getDocuments - [${country}] Response:`, response.data);

          // Add country metadata to each document
          const documentsWithCountry = (response.data.documentos || []).map((doc: ProtheusDocument) => ({
            ...doc,
            _country: country // Add country identifier
          }));

          return { country, documentos: documentsWithCountry, success: true };
        } catch (error: any) {
          console.error(`Error fetching documents from ${country}:`, error);

          // Classify error type and create detailed error info
          let errorType: 'network' | 'auth' | 'server' | 'unknown' = 'unknown';
          let errorMessage = 'Erro ao buscar documentos';
          let statusCode: number | undefined;

          if (axios.isAxiosError(error)) {
            statusCode = error.response?.status;

            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
              errorType = 'network';
              errorMessage = getErrorMessage('timeoutError');
            } else if (error.code === 'ERR_NETWORK' || !error.response) {
              errorType = 'network';
              errorMessage = getErrorMessage('networkErrorServerUnavailable');
            } else if (statusCode === 401 || statusCode === 403) {
              errorType = 'auth';
              errorMessage = statusCode === 401 ? getErrorMessage('sessionExpired') : getErrorMessage('noPermissionDocuments');
            } else if (statusCode && statusCode >= 500) {
              errorType = 'server';
              errorMessage = `${getErrorMessage('errorFetchingDocuments')} (${statusCode})`;
            } else if (statusCode && statusCode >= 400) {
              errorType = 'server';
              errorMessage = `${getErrorMessage('errorFetchingDocuments')} (${statusCode})`;
            }
          } else {
            errorMessage = error.message || getErrorMessage('unknownError');
          }

          return {
            country,
            documentos: [],
            success: false,
            error: {
              country,
              status: statusCode,
              message: errorMessage,
              type: errorType
            } as ApiError
          };
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(promises);

      // Separate successful and failed results
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      // Combine all documents from successful countries
      const allDocuments = successfulResults.flatMap(result => result.documentos);

      // Collect error information
      const apiErrors = failedResults.map(r => r.error!).filter(Boolean);
      const successfulCountries = successfulResults.map(r => r.country);
      const failedCountries = failedResults.map(r => r.country);

      // Log summary
      console.log(`documentService.getDocuments - Total documents from all countries: ${allDocuments.length}`);
      if (apiErrors.length > 0) {
        console.warn(`documentService.getDocuments - ${apiErrors.length} countries failed:`, failedCountries);
        apiErrors.forEach(error => {
          console.warn(`  [${error.country}] ${error.type}: ${error.message}${error.status ? ` (${error.status})` : ''}`);
        });
      }

      return {
        documentos: allDocuments,
        errors: apiErrors.length > 0 ? apiErrors : undefined,
        hasErrors: apiErrors.length > 0,
        successfulCountries,
        failedCountries: failedCountries.length > 0 ? failedCountries : undefined
      };
    } catch (error: any) {
      console.error('Error fetching documents:', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error(getErrorMessage('sessionExpired'));
        } else if (error.response?.status === 403) {
          throw new Error(getErrorMessage('noPermissionDocuments'));
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error(getErrorMessage('errorFetchingDocuments'));
        }
      } else {
        throw new Error(getErrorMessage('errorFetchingDocuments'));
      }
    }
  },

  // Get single document by number
  async getDocument(numero: string, userEmail: string): Promise<ProtheusDocument | undefined> {
    try {
      console.log('Fetching document from Protheus:', numero);
      
      // Get all documents and find the specific one
      const response = await this.getDocuments(userEmail);
      const document = response.documentos.find(doc => String(doc.numero).trim() === numero.trim());

      if (!document) {
        throw new Error(getErrorMessage('documentNotFound'));
      }
      
      return document;
    } catch (error: any) {
      console.error('Error fetching document:', error);

      if (error.message === getErrorMessage('documentNotFound')) {
        throw error;
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error(getErrorMessage('sessionExpired'));
        } else if (error.response?.status === 403) {
          throw new Error(getErrorMessage('noPermissionDocument'));
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error(getErrorMessage('errorFetchingDocument'));
        }
      } else {
        throw new Error(getErrorMessage('errorFetchingDocument'));
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
        throw new Error(getErrorMessage('documentNotFoundApproval'));
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
        throw new Error(getErrorMessage('approverNotFound'));
      }

      const requestBody = {
        TIPO: action.document.tipo,
        DOCUMENTO: String(action.document.numero).trim(),
        APROVADOR: currentApprover.aprovador_aprov,
        STATUS: 'APROVACAO',
        OBSERVACAO: action.comments || ''
      };

      // Voltar ao formato original sem quebra de linha
      const requestId = Math.random().toString(36).substring(7);
      // Extract only the filial code, removing description after " - "
      const filialCode = action.document.filial.split(' - ')[0].trim();
      const tenantId = `01,${filialCode}`;
      console.log(`🚀 APROVAÇÃO [${requestId}] - TenantId:`, JSON.stringify(tenantId));
      console.log(`🚀 APROVAÇÃO [${requestId}] - Documento: ${action.document.numero}`);

      // Get the country-specific configuration if document has country metadata
      const documentCountry = action.document._country as Country | undefined;
      const countryConfig = documentCountry
        ? getApiConfigFor(documentCountry, 'PROTHEUS')
        : config;

      console.log(`🚀 APROVAÇÃO [${requestId}] - Using config for country:`, documentCountry || 'default');

      // Create Basic Auth header with country-specific credentials
      const credentials = documentCountry
        ? btoa(`${countryConfig.auth.username}:${countryConfig.auth.password}`)
        : btoa(`${config.auth.username}:${config.auth.password}`);

      const baseUrl = documentCountry ? countryConfig.baseUrl : config.protheus.baseUrl;
      const endpoint = documentCountry ? countryConfig.endpoints.aprovaDocumento : config.api.aprovaDocumento;
      const apiUrl = `${baseUrl}${endpoint}`;
      
      console.log('Calling approval API with axios:', {
        url: apiUrl,
        tenantId,
        body: requestBody,
        currentApprover: currentApprover,
        userEmail: userEmail
      });

      console.log('📤 REQUEST BODY:', JSON.stringify(requestBody, null, 2));

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
        throw new Error(getErrorMessage('connectionError'));
      } else if (error.name === 'TimeoutError') {
        throw new Error(getErrorMessage('timeoutError'));
      } else if (error.message?.includes('CONNECTION_RESET')) {
        throw new Error(getErrorMessage('connectionReset'));
      } else {
        throw new Error(error.message || getErrorMessage('errorApprovingDocumentFull'));
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
        throw new Error(getErrorMessage('documentNotFoundRejection'));
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
        throw new Error(getErrorMessage('approverNotFound'));
      }

      const requestBody = {
        TIPO: action.document.tipo,
        DOCUMENTO: String(action.document.numero).trim(),
        APROVADOR: currentApprover.aprovador_aprov,
        STATUS: 'REJEICAO',
        OBSERVACAO: action.comments || 'Rejeitado pelo aprovador'
      };

      // Voltar ao formato original sem quebra de linha
      const requestId = Math.random().toString(36).substring(7);
      // Extract only the filial code, removing description after " - "
      const filialCode = action.document.filial.split(' - ')[0].trim();
      const tenantId = `01,${filialCode}`;
      console.log(`🚀 REJEIÇÃO [${requestId}] - TenantId:`, JSON.stringify(tenantId));

      // Get the country-specific configuration if document has country metadata
      const documentCountry = action.document._country as Country | undefined;
      const countryConfig = documentCountry
        ? getApiConfigFor(documentCountry, 'PROTHEUS')
        : config;

      console.log(`🚀 REJEIÇÃO [${requestId}] - Using config for country:`, documentCountry || 'default');

      // Create Basic Auth header with country-specific credentials
      const credentials = documentCountry
        ? btoa(`${countryConfig.auth.username}:${countryConfig.auth.password}`)
        : btoa(`${config.auth.username}:${config.auth.password}`);

      const baseUrl = documentCountry ? countryConfig.baseUrl : config.protheus.baseUrl;
      const endpoint = documentCountry ? countryConfig.endpoints.aprovaDocumento : config.api.aprovaDocumento;
      const apiUrl = `${baseUrl}${endpoint}`;
      
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
        throw new Error(getErrorMessage('connectionError'));
      } else if (error.name === 'TimeoutError') {
        throw new Error(getErrorMessage('timeoutError'));
      } else if (error.message?.includes('CONNECTION_RESET')) {
        throw new Error(getErrorMessage('connectionReset'));
      } else {
        throw new Error(error.message || getErrorMessage('errorRejectingDocumentFull'));
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
      throw new Error(getErrorMessage('errorFetchingDashboardStats'));
    }
  }
};