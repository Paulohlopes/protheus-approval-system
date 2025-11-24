export enum RegistrationStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  IN_APPROVAL = 'IN_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SYNCING_TO_PROTHEUS = 'SYNCING_TO_PROTHEUS',
  SYNCED = 'SYNCED',
  SYNC_FAILED = 'SYNC_FAILED',
}

export enum ApprovalAction {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface FormTemplate {
  id: string;
  tableName: string;
  label: string;
  description?: string;
  isActive: boolean;
  fields?: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  templateId: string;
  sx3FieldName: string;
  label: string;
  fieldType: 'string' | 'number' | 'date' | 'boolean' | 'text';
  isRequired: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  fieldOrder: number;
  fieldGroup?: string;
  validationRules?: any;
  metadata?: {
    size?: number;
    decimals?: number;
    mask?: string;
    lookup?: string;
    validation?: string;
    when?: string;
    defaultValue?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationRequest {
  id: string;
  templateId: string;
  template?: FormTemplate;
  tableName: string;
  requestedById: string;
  requestedBy?: {
    id: string;
    name: string;
    email: string;
  };
  requestedByEmail: string;
  requestedAt: string;
  formData: Record<string, any>;
  status: RegistrationStatus;
  currentLevel: number;
  workflowSnapshot?: any;
  approvals?: RegistrationApproval[];
  protheusRecno?: string;
  syncedAt?: string;
  syncError?: string;
  syncLog?: any;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationApproval {
  id: string;
  requestId: string;
  level: number;
  approverId: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  approverEmail: string;
  action: ApprovalAction;
  comments?: string;
  actionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationWorkflow {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  isActive: boolean;
  routingRules?: any;
  levels: WorkflowLevel[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowLevel {
  id: string;
  workflowId: string;
  levelOrder: number;
  levelName?: string;
  approverIds: string[];
  isParallel: boolean;
  conditions?: any;
  createdAt: string;
  updatedAt: string;
}
