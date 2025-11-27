/**
 * MAN-02: Centralized Type Definitions
 * All shared types and interfaces should be defined here
 */

// Re-export Prisma enums for convenience
export { RegistrationStatus, ApprovalAction } from '@prisma/client';

// ==========================================
// USER TYPES
// ==========================================

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

export interface UserInfo extends UserBasicInfo {
  isAdmin: boolean;
  isActive?: boolean;
}

export interface UserWithGroups extends UserInfo {
  groups: Array<{
    id: string;
    name: string;
  }>;
}

// ==========================================
// WORKFLOW TYPES
// ==========================================

export interface WorkflowApprover {
  id: string;
  name: string;
  email: string;
}

export interface WorkflowGroup {
  id: string;
  name: string;
  description?: string;
  members: WorkflowApprover[];
}

export interface WorkflowLevelSnapshot {
  levelOrder: number;
  levelName: string;
  approverIds: string[];
  approverGroupIds?: string[];
  editableFields?: string[];
  isParallel: boolean;
  conditions?: Record<string, unknown>;
  // Enriched data (populated from IDs)
  approvers?: WorkflowApprover[];
  approverGroups?: WorkflowGroup[];
}

export interface WorkflowSnapshot {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  isActive: boolean;
  requiresSequentialApproval: boolean;
  routingRules?: Record<string, unknown>;
  levels: WorkflowLevelSnapshot[];
}

// ==========================================
// REGISTRATION TYPES
// ==========================================

export type FormData = Record<string, unknown>;

export interface FieldChange {
  fieldName: string;
  previousValue: unknown;
  newValue: unknown;
  changedById: string;
  changedByName?: string;
  approvalLevel: number;
  changedAt: Date;
}

export interface RegistrationFilters {
  status?: string;
  requestedById?: string;
  templateId?: string;
}

export interface StuckWorkflowInfo {
  registrationId: string;
  templateName: string;
  tableName: string;
  requestedBy: UserBasicInfo;
  status: string;
  currentLevel: number;
  createdAt: Date;
  pendingApprovals: Array<{
    approverId: string;
    approverName: string;
    approverEmail: string;
    isActive: boolean;
  }>;
  reason: string;
}

export interface WorkflowStuckStatus {
  isStuck: boolean;
  reason: string | null;
  currentLevel: number;
  status: string;
  pendingApprovers?: Array<{
    approverId: string;
    approverName: string;
    isActive: boolean;
  }>;
  deactivatedApprovers?: Array<{
    approvalId: string;
    approverId: string;
    approverName: string;
    approverEmail: string;
  }>;
  activeApprovers?: UserBasicInfo[];
}

// ==========================================
// APPROVAL TYPES
// ==========================================

export interface ApprovalInfo {
  id: string;
  level: number;
  action: string;
  comments?: string;
  actionAt?: Date;
  approverId: string;
  approver: UserBasicInfo;
}

export type AdminOverrideAction = 'force_approve' | 'skip_level';

export interface AdminOverrideRequest {
  action: AdminOverrideAction;
  comments?: string;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==========================================
// HEALTH CHECK TYPES
// ==========================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: DatabaseHealthCheck;
    memory: MemoryHealthCheck;
    protheus?: ProtheusHealthCheck;
  };
}

export interface DatabaseHealthCheck {
  status: HealthStatus;
  responseTime: number;
  message?: string;
}

export interface MemoryHealthCheck {
  status: HealthStatus;
  usedMB: number;
  totalMB: number;
  percentUsed: number;
}

export interface ProtheusHealthCheck {
  status: HealthStatus;
  lastSyncAt?: string;
  message?: string;
}

// ==========================================
// SETTINGS TYPES
// ==========================================

export interface SystemSettingInput {
  key: string;
  value: string;
  description?: string;
  isSecret?: boolean;
  category?: string;
}

export interface SystemSettingOutput {
  key: string;
  value: string; // Masked if isSecret
  description?: string;
  isSecret: boolean;
  category?: string;
  updatedAt: Date;
}

// ==========================================
// PROTHEUS INTEGRATION TYPES
// ==========================================

export interface ProtheusSyncResult {
  success: boolean;
  registrationId: string;
  protheusRecno?: string;
  error?: string;
  log?: string[];
}

export interface ProtheusFieldMapping {
  sx3FieldName: string;
  protheusFieldName: string;
  transformFn?: (value: unknown) => unknown;
}

// ==========================================
// AUDIT LOG TYPES
// ==========================================

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

// ==========================================
// TYPE GUARDS
// ==========================================

export function isUserInfo(obj: unknown): obj is UserInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  );
}

export function isWorkflowSnapshot(obj: unknown): obj is WorkflowSnapshot {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'levels' in obj &&
    Array.isArray((obj as WorkflowSnapshot).levels)
  );
}
