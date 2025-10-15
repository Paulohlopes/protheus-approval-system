import api from './api';
import ProtheusQueryBuilder, { type WhereCondition, type QueryOptions } from '../utils/queryBuilder';
import { purchaseRequestFiltersSchema, purchaseOrderFiltersSchema, ValidationUtils } from '../schemas/validation';
import { config } from '../config/environment';
import { getErrorMessage } from '../utils/translationHelpers';
import type {
  PurchaseRequest,
  PurchaseRequestsResponse,
  PurchaseRequestFilters,
  PurchaseOrder,
  PurchaseOrdersResponse,
  PurchaseOrderFilters
} from '../types/purchase';

export const purchaseService = {
  // Buscar todas as solicitações de compra com paginação
  async getPurchaseRequests(filters?: PurchaseRequestFilters): Promise<PurchaseRequestsResponse> {
    try {
      // Validate input filters
      let validatedFilters: PurchaseRequestFilters | undefined;
      if (filters) {
        validatedFilters = ValidationUtils.validate(purchaseRequestFiltersSchema, filters);
      }

      // Build secure query using query builder
      const whereConditions: WhereCondition[] = [];
      
      if (validatedFilters) {
        if (validatedFilters.filial) {
          whereConditions.push({
            field: 'C1_FILIAL',
            operator: 'eq',
            value: validatedFilters.filial
          });
        }
        
        if (validatedFilters.solicitante) {
          whereConditions.push({
            field: 'C1_SOLICIT',
            operator: 'like',
            value: validatedFilters.solicitante
          });
        }
        
        if (validatedFilters.numeroSC) {
          whereConditions.push({
            field: 'C1_NUM',
            operator: 'eq',
            value: validatedFilters.numeroSC
          });
        }
        
        if (validatedFilters.dataInicio && validatedFilters.dataFim) {
          whereConditions.push({
            field: 'C1_EMISSAO',
            operator: 'between',
            value: [validatedFilters.dataInicio, validatedFilters.dataFim]
          });
        }
      }

      const queryOptions: QueryOptions = {
        tables: 'SC1',
        fields: [
          'C1_FILIAL', 'C1_NUM', 'C1_ITEM', 'C1_PRODUTO', 
          'C1_DESCRI', 'C1_QUANT', 'C1_UM', 'C1_DATPRF', 
          'C1_OBS', 'C1_CC', 'C1_EMISSAO', 'C1_SOLICIT', 'C1_TOTAL', 'C1_CODCOMP'
        ],
        where: whereConditions,
        page: validatedFilters?.page,
        pageSize: validatedFilters?.pageSize
      };

      const queryString = ProtheusQueryBuilder.buildQuery(queryOptions);
      const url = `${config.api.genericQuery}?${queryString}`;

      console.log('Buscando solicitações de compra (secure query)...', url);
      
      const response = await api.get<PurchaseRequestsResponse>(url);
      
      console.log(`${response.data.items?.length || 0} solicitações encontradas, hasNext: ${response.data.hasNext}, remaining: ${response.data.remainingRecords}`);
      return response.data;
      
    } catch (error: any) {
      console.error('Erro ao buscar solicitações de compra:', error);

      if (error.response?.status === 401) {
        throw new Error(getErrorMessage('sessionExpired'));
      } else if (error.response?.status === 403) {
        throw new Error(getErrorMessage('noPermissionPurchaseRequests'));
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(getErrorMessage('errorLoadingPurchaseRequests'));
      }
    }
  },

  // Buscar solicitação específica por número
  async getPurchaseRequestByNumber(numero: string, filial?: string): Promise<PurchaseRequestsResponse> {
    try {
      const filters: PurchaseRequestFilters = { numeroSC: numero };
      if (filial) filters.filial = filial;
      
      return await this.getPurchaseRequests(filters);
    } catch (error) {
      console.error('Erro ao buscar solicitação específica:', error);
      throw error;
    }
  },

  // Buscar solicitações por solicitante
  async getPurchaseRequestsByUser(solicitante: string, page?: number, pageSize?: number): Promise<PurchaseRequestsResponse> {
    try {
      const filters: PurchaseRequestFilters = { solicitante, page, pageSize };
      return await this.getPurchaseRequests(filters);
    } catch (error) {
      console.error('Erro ao buscar solicitações do usuário:', error);
      throw error;
    }
  },

  // Buscar solicitações por período
  async getPurchaseRequestsByPeriod(dataInicio: string, dataFim: string, page?: number, pageSize?: number): Promise<PurchaseRequestsResponse> {
    try {
      const filters: PurchaseRequestFilters = { dataInicio, dataFim, page, pageSize };
      return await this.getPurchaseRequests(filters);
    } catch (error) {
      console.error('Erro ao buscar solicitações por período:', error);
      throw error;
    }
  },

  // ===== PEDIDOS DE COMPRA (PC) =====

  // Buscar todos os pedidos de compra com paginação
  async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<PurchaseOrdersResponse> {
    try {
      // Validate input filters
      let validatedFilters: PurchaseOrderFilters | undefined;
      if (filters) {
        validatedFilters = ValidationUtils.validate(purchaseOrderFiltersSchema, filters);
      }

      // Build URL parameters for genericQuery
      const params = new URLSearchParams();
      
      // Tables
      params.append('tables', 'SC7');
      
      // Fields
      const fields = [
        'C7_FILIAL', 'C7_NUM', 'C7_ITEM', 'C7_FORNECE', 'C7_LOJA',
        'C7_PRODUTO', 'C7_DESCRI', 'C7_QUANT', 'C7_UM', 'C7_DATPRF',
        'C7_OBS', 'C7_CC', 'C7_CER', 'C7_ITEMCER', 'C7_EMISSAO',
        'C7_SOLICIT', 'C7_TOTAL', 'C7_COND', 'C7_USER'
      ];
      params.append('fields', fields.join(', '));
      
      // Where conditions
      let whereConditions = ['SC7.D_E_L_E_T_=\' \''];
      
      if (validatedFilters) {
        if (validatedFilters.filial) {
          whereConditions.push(`C7_FILIAL = '${validatedFilters.filial}'`);
        }
        
        if (validatedFilters.solicitante) {
          whereConditions.push(`C7_SOLICIT LIKE '%${validatedFilters.solicitante}%'`);
        }
        
        if (validatedFilters.numeroPC) {
          whereConditions.push(`C7_NUM = '${validatedFilters.numeroPC}'`);
        }
        
        if (validatedFilters.fornecedor) {
          whereConditions.push(`C7_FORNECE = '${validatedFilters.fornecedor}'`);
        }
        
        if (validatedFilters.dataInicio && validatedFilters.dataFim) {
          whereConditions.push(`C7_EMISSAO BETWEEN '${validatedFilters.dataInicio}' AND '${validatedFilters.dataFim}'`);
        }
      }
      
      params.append('where', whereConditions.join(' AND '));
      
      // Pagination
      if (validatedFilters?.page) {
        params.append('page', validatedFilters.page.toString());
      }
      if (validatedFilters?.pageSize) {
        params.append('pageSize', validatedFilters.pageSize.toString());
      }

      const url = `${config.api.genericQuery}?${params.toString()}`;

      console.log('Buscando pedidos de compra...', url);
      
      const response = await api.get<PurchaseOrdersResponse>(url);
      
      console.log(`${response.data.items?.length || 0} pedidos encontrados, hasNext: ${response.data.hasNext}, remaining: ${response.data.remainingRecords}`);
      return response.data;
      
    } catch (error: any) {
      console.error('Erro ao buscar pedidos de compra:', error);

      if (error.response?.status === 401) {
        throw new Error(getErrorMessage('sessionExpired'));
      } else if (error.response?.status === 403) {
        throw new Error(getErrorMessage('noPermissionPurchaseOrders'));
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(getErrorMessage('errorLoadingPurchaseOrders'));
      }
    }
  },

  // Buscar pedido específico por número
  async getPurchaseOrderByNumber(numero: string, filial?: string): Promise<PurchaseOrdersResponse> {
    try {
      const filters: PurchaseOrderFilters = { numeroPC: numero };
      if (filial) filters.filial = filial;
      
      return await this.getPurchaseOrders(filters);
    } catch (error) {
      console.error('Erro ao buscar pedido específico:', error);
      throw error;
    }
  },

  // Buscar pedidos por solicitante
  async getPurchaseOrdersByUser(solicitante: string, page?: number, pageSize?: number): Promise<PurchaseOrdersResponse> {
    try {
      const filters: PurchaseOrderFilters = { solicitante, page, pageSize };
      return await this.getPurchaseOrders(filters);
    } catch (error) {
      console.error('Erro ao buscar pedidos do usuário:', error);
      throw error;
    }
  },

  // Buscar pedidos por período
  async getPurchaseOrdersByPeriod(dataInicio: string, dataFim: string, page?: number, pageSize?: number): Promise<PurchaseOrdersResponse> {
    try {
      const filters: PurchaseOrderFilters = { dataInicio, dataFim, page, pageSize };
      return await this.getPurchaseOrders(filters);
    } catch (error) {
      console.error('Erro ao buscar pedidos por período:', error);
      throw error;
    }
  }
};