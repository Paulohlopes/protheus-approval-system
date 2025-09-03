import api from './api';
import type { PurchaseRequest, PurchaseRequestsResponse, PurchaseRequestFilters } from '../types/purchase';

const PURCHASE_REQUESTS_URL = import.meta.env.VITE_API_PURCHASE_REQUESTS;

export const purchaseService = {
  // Buscar todas as solicitações de compra com paginação
  async getPurchaseRequests(filters?: PurchaseRequestFilters): Promise<PurchaseRequestsResponse> {
    try {
      let url = PURCHASE_REQUESTS_URL;
      const params = new URLSearchParams();
      
      // Construir query base
      params.set('tables', 'SC1');
      params.set('fields', 'C1_FILIAL,C1_NUM,C1_ITEM,C1_PRODUTO,C1_DESCRI,C1_QUANT,C1_UM,C1_DATPRF,C1_OBS,C1_CC,C1_EMISSAO,C1_SOLICIT,C1_TOTAL');
      
      // Aplicar filtros onde
      const whereConditions: string[] = ["SC1.D_E_L_E_T_=' '"];
      
      if (filters) {
        if (filters.filial) {
          whereConditions.push(`c1_filial='${filters.filial}'`);
        }
        
        if (filters.solicitante) {
          whereConditions.push(`c1_solicit LIKE '%${filters.solicitante}%'`);
        }
        
        if (filters.numeroSC) {
          whereConditions.push(`c1_num='${filters.numeroSC}'`);
        }
        
        if (filters.dataInicio && filters.dataFim) {
          whereConditions.push(`c1_emissao>='${filters.dataInicio}' AND c1_emissao<='${filters.dataFim}'`);
        }
        
        // Parâmetros de paginação
        if (filters.page && filters.page > 1) {
          params.set('page', filters.page.toString());
        }
        
        if (filters.pageSize) {
          params.set('pageSize', filters.pageSize.toString());
        }
      }
      
      params.set('where', whereConditions.join(' AND '));
      url = `/api/framework/v1/genericQuery?${params.toString()}`;
      
      console.log('Buscando solicitações de compra...', url);
      
      const response = await api.get<PurchaseRequestsResponse>(url);
      
      console.log(`${response.data.items?.length || 0} solicitações encontradas, hasNext: ${response.data.hasNext}, remaining: ${response.data.remainingRecords}`);
      return response.data;
      
    } catch (error: any) {
      console.error('Erro ao buscar solicitações de compra:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        throw new Error('Sem permissão para acessar solicitações de compra.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao carregar solicitações de compra.');
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
  }
};