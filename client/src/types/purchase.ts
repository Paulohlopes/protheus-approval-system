export interface PurchaseRequest {
  c1_filial: string;     // Filial
  c1_num: string;        // Número da SC
  c1_item: string;       // Item
  c1_produto: string;    // Código do produto
  c1_descri: string;     // Descrição do produto
  c1_quant: number;      // Quantidade
  c1_um: string;         // Unidade de medida
  c1_datprf: string;     // Data necessidade
  c1_obs: string;        // Observações
  c1_cc: string;         // Centro de custo
  c1_emissao: string;    // Data emissão
  c1_solicit: string;    // Solicitante
  c1_total: number;      // Valor total
}

export interface PurchaseRequestsResponse {
  items: PurchaseRequest[];
  hasNext: boolean;
  remainingRecords: number;
  protectedDataFields: string[];
  nivelFields: string[];
}

export interface PurchaseRequestFilters {
  filial?: string;
  solicitante?: string;
  dataInicio?: string;
  dataFim?: string;
  numeroSC?: string;
  page?: number;
  pageSize?: number;
}