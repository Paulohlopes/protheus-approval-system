export interface ProtheusLoginCredentials {
  username: string;
  password: string;
  company?: string;
  branch?: string;
}

export interface ProtheusAuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  user?: ProtheusUser;
}

export interface ProtheusUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  companyId?: string;
  branchId?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
  lastLogin?: string;
  permissions?: string[];
}

export interface DocumentItem {
  item: string;
  produto: string;
  descr_produto: string;
  unidade_medida: string;
  quantidade: number;
  moeda: number;
  descr_moeda: string;
  preco: string;
  data_entrega: string;
  total: string;
  centro_custo: string;
  descr_cc: string;
  conta_contabil: string;
  descr_conta_contabil: string;
  item_cta: string;
  classe_valor: string;
  observacao: string;
  cer: string;
  item_cer: string;
  descr_cer: string;
}

export interface DocumentApprovalLevel {
  aprovador_aprov: string;
  grupo_aprov: string;
  nivel_aprov: string;
  situacao_aprov: string;
  data_lib_aprov: string;
  observacao_aprov: string;
  avaliado_aprov: string;
  CNOME: string;
  CSUPERIOR: string;
  CTIPOLIBERACAO: string;
  CCODUSUARIO: string;
  CDESCGRUPO: string;
  CIDENTIFICADOR: string;
}

export interface ProtheusDocument {
  filial: string;
  numero: string;
  tipo: 'IP' | 'SC' | 'CP';
  Emissao: string;
  itens: DocumentItem[];
  alcada: DocumentApprovalLevel[];
  cond_pagamento: string;
  comprador: string;
  cod_fornecedor: string;
  loja: string;
  nome_fornecedor: string;
  vl_tot_documento: string;
}

export interface ProtheusAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface ApprovalStep {
  id: string;
  sequence: number;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: string;
  isCurrentStep?: boolean;
}

export interface ApprovalAction {
  documentId: string;
  action: 'approve' | 'reject';
  comments?: string;
  approverId: string;
}

export interface AuthState {
  user: ProtheusUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Dashboard statistics types
export interface DashboardStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  highPriority: number;
  expiringSoon: number;
}

// Filter and pagination types
export interface DocumentFilters {
  status?: string[];
  priority?: string[];
  type?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  requester?: string;
  search?: string;
  aprovador?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProtheusApiResponse {
  documentos: ProtheusDocument[];
}