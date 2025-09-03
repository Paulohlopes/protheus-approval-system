import api from './api';
import type { PurchaseRequest, PurchaseRequestsResponse, PurchaseRequestFilters } from '../types/purchase';

const PURCHASE_REQUESTS_URL = import.meta.env.VITE_API_PURCHASE_REQUESTS;

export const purchaseService = {
  // Buscar todas as solicitações de compra
  async getPurchaseRequests(filters?: PurchaseRequestFilters): Promise<PurchaseRequest[]> {
    try {
      let url = PURCHASE_REQUESTS_URL;
      
      // Aplicar filtros se fornecidos
      if (filters) {
        const whereConditions: string[] = ["SC1.D_E_L_E_T_=' '"];
        
        if (filters.filial) {
          whereConditions.push(`C1_FILIAL='${filters.filial}'`);
        }
        
        if (filters.solicitante) {
          whereConditions.push(`C1_SOLICIT LIKE '%${filters.solicitante}%'`);
        }
        
        if (filters.numeroSC) {
          whereConditions.push(`C1_NUM='${filters.numeroSC}'`);
        }
        
        if (filters.dataInicio && filters.dataFim) {
          whereConditions.push(`C1_EMISSAO>='${filters.dataInicio}' AND C1_EMISSAO<='${filters.dataFim}'`);
        }
        
        const whereClause = whereConditions.join(' AND ');
        url = `/api/framework/v1/genericQuery?tables=SC1&fields=C1_FILIAL,C1_NUM,C1_ITEM,C1_PRODUTO,C1_DESCRI,C1_QUANT,C1_UM,C1_DATPRF,C1_OBS,C1_CC,C1_EMISSAO,C1_SOLICIT,C1_TOTAL&where=${encodeURIComponent(whereClause)}`;
      }
      
      console.log('Buscando solicitações de compra...', url);
      
      const response = await api.get(url);
      
      // A resposta pode vir em diferentes formatos dependendo da versão do Protheus
      let data: PurchaseRequest[] = [];
      
      if (response.data?.data) {
        data = response.data.data;
      } else if (response.data?.items) {
        data = response.data.items;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else {
        console.warn('Formato de resposta não reconhecido:', response.data);
        data = [];
      }
      
      console.log(`${data.length} solicitações encontradas`);
      return data;
      
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
  async getPurchaseRequestByNumber(numero: string, filial?: string): Promise<PurchaseRequest[]> {
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
  async getPurchaseRequestsByUser(solicitante: string): Promise<PurchaseRequest[]> {
    try {
      const filters: PurchaseRequestFilters = { solicitante };
      return await this.getPurchaseRequests(filters);
    } catch (error) {
      console.error('Erro ao buscar solicitações do usuário:', error);
      throw error;
    }
  },

  // Buscar solicitações por período
  async getPurchaseRequestsByPeriod(dataInicio: string, dataFim: string): Promise<PurchaseRequest[]> {
    try {
      const filters: PurchaseRequestFilters = { dataInicio, dataFim };
      return await this.getPurchaseRequests(filters);
    } catch (error) {
      console.error('Erro ao buscar solicitações por período:', error);
      throw error;
    }
  }
};