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
  c1_codcomp: string;    // Comprador
}

export interface PurchaseOrder {
  c7_filial: string;      // Filial
  c7_num: string;         // Número do PC
  c7_item: string;        // Item
  c7_fornece: string;     // Código do fornecedor
  c7_loja: string;        // Loja do fornecedor
  c7_produto: string;     // Código do produto
  c7_descri: string;      // Descrição do produto
  c7_quant: number;       // Quantidade
  c7_um: string;          // Unidade de medida
  c7_datprf: string;      // Data de entrega
  c7_obs: string;         // Observações
  c7_cc: string;          // Centro de custo
  c7_cer: string;         // CER
  c7_itemcer: string;     // Item CER
  c7_emissao: string;     // Data de emissão
  c7_solicit: string;     // Solicitante
  c7_total: number;       // Valor total
  c7_cond: string;        // Condição de pagamento
  c7_user: string;        // Comprador
}

export interface PurchaseRequestsResponse {
  items: PurchaseRequest[];
  hasNext: boolean;
  remainingRecords: number;
  protectedDataFields: string[];
  nivelFields: string[];
}

export interface PurchaseOrdersResponse {
  items: PurchaseOrder[];
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

export interface PurchaseOrderFilters {
  filial?: string;
  solicitante?: string;
  dataInicio?: string;
  dataFim?: string;
  numeroPC?: string;
  fornecedor?: string;
  page?: number;
  pageSize?: number;
}