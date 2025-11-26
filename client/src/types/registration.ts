export const RegistrationStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  IN_APPROVAL: 'IN_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SYNCING_TO_PROTHEUS: 'SYNCING_TO_PROTHEUS',
  SYNCED: 'SYNCED',
  SYNC_FAILED: 'SYNC_FAILED',
} as const;

export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const ApprovalAction = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalAction = (typeof ApprovalAction)[keyof typeof ApprovalAction];

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
  // Multi-language labels
  labelPtBR?: string;
  labelEn?: string;
  labelEs?: string;
  // Multi-language descriptions
  descriptionPtBR?: string;
  descriptionEn?: string;
  descriptionEs?: string;
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

// Supported languages type
export type SupportedLanguage = 'pt-BR' | 'en' | 'es';

// Helper function to get field label based on current language
export function getFieldLabel(field: FormField, language: SupportedLanguage): string {
  switch (language) {
    case 'en':
      return field.labelEn || field.label;
    case 'es':
      return field.labelEs || field.label;
    case 'pt-BR':
    default:
      return field.labelPtBR || field.label;
  }
}

// Helper function to get field description based on current language
export function getFieldDescription(field: FormField, language: SupportedLanguage): string | undefined {
  switch (language) {
    case 'en':
      return field.descriptionEn || field.descriptionPtBR;
    case 'es':
      return field.descriptionEs || field.descriptionPtBR;
    case 'pt-BR':
    default:
      return field.descriptionPtBR;
  }
}

export type RegistrationRequest = {
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
};

export type RegistrationApproval = {
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
};

export type RegistrationWorkflow = {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  isActive: boolean;
  routingRules?: any;
  levels: WorkflowLevel[];
  createdAt: string;
  updatedAt: string;
};

export type WorkflowLevel = {
  id: string;
  workflowId: string;
  levelOrder: number;
  levelName?: string;
  approverIds: string[];
  isParallel: boolean;
  conditions?: any;
  createdAt: string;
  updatedAt: string;
};
