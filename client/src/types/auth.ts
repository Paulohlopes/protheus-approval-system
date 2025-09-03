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

export interface ProtheusDocument {
  id: string;
  type: string;
  number: string;
  series?: string;
  description: string;
  value: number;
  currency: string;
  requestDate: string;
  dueDate?: string;
  requester: {
    id: string;
    name: string;
    department?: string;
  };
  approver?: {
    id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  comments?: string;
  attachments?: ProtheusAttachment[];
  approvalFlow?: ApprovalStep[];
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