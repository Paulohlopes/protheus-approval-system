export interface PurchaseRequest {
  C1_FILIAL: string;     // Filial
  C1_NUM: string;        // Número da SC
  C1_ITEM: string;       // Item
  C1_PRODUTO: string;    // Código do produto
  C1_DESCRI: string;     // Descrição do produto
  C1_QUANT: number;      // Quantidade
  C1_UM: string;         // Unidade de medida
  C1_DATPRF: string;     // Data necessidade
  C1_OBS: string;        // Observações
  C1_CC: string;         // Centro de custo
  C1_EMISSAO: string;    // Data emissão
  C1_SOLICIT: string;    // Solicitante
  C1_TOTAL: number;      // Valor total
}

export interface PurchaseRequestsResponse {
  success: boolean;
  data: PurchaseRequest[];
  message?: string;
}

export interface PurchaseRequestFilters {
  filial?: string;
  solicitante?: string;
  dataInicio?: string;
  dataFim?: string;
  numeroSC?: string;
}