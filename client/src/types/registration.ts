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

// ==========================================
// FIELD TYPES
// ==========================================

export type FieldType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'autocomplete'
  | 'multiselect'
  | 'attachment';

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: 'Texto',
  number: 'Número',
  date: 'Data',
  boolean: 'Sim/Não',
  text: 'Texto Longo',
  textarea: 'Texto Longo',
  select: 'Lista de Opções',
  checkbox: 'Checkbox',
  radio: 'Radio Buttons',
  autocomplete: 'Autocomplete (Busca)',
  multiselect: 'Seleção Múltipla',
  attachment: 'Anexos',
};

// ==========================================
// DATA SOURCE CONFIGURATION
// ==========================================

export type DataSourceType = 'fixed' | 'sql' | 'sx5';

export interface DataSourceOption {
  key?: string; // Unique key for React rendering (optional, defaults to value)
  value: string;
  label: string;
}

export interface DataSourceResponse {
  options: DataSourceOption[];
  warning?: string; // Warning message (e.g., duplicate values detected)
  duplicateCount?: number; // Number of duplicate values found
}

export interface DataSourceConfig {
  type: DataSourceType;
  fixedOptions?: DataSourceOption[];
  sqlQuery?: string;
  keyField?: string; // Field that uniquely identifies each row (for React keys)
  valueField?: string; // Field that contains the value to be stored
  labelField?: string; // Field that contains the display label
  sx5Table?: string;
}

// ==========================================
// VALIDATION RULES
// ==========================================

export type DependsOnCondition = 'equals' | 'notEquals' | 'contains' | 'isNotEmpty';

export interface SqlValidation {
  query: string;
  errorMessage: string;
}

export interface DependsOn {
  fieldName: string;
  condition: DependsOnCondition;
  value?: string;
  filterField?: string;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  mask?: string;
  min?: number;
  max?: number;
  sqlValidation?: SqlValidation;
  dependsOn?: DependsOn;
}

// ==========================================
// ATTACHMENT CONFIGURATION
// ==========================================

export interface AttachmentConfig {
  allowedTypes: string[];
  maxSize?: number; // bytes (default: 10MB)
  maxFiles?: number; // default: 5
}

export interface FieldAttachment {
  id: string;
  registrationId: string;
  fieldName: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  uploadedById?: string;
  uploadedAt: string;
}

// ==========================================
// FORM FIELD
// ==========================================

export interface FormField {
  id: string;
  templateId: string;
  sx3FieldName?: string;
  fieldName?: string;
  label: string;
  fieldType: FieldType;
  isRequired: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  isCustomField?: boolean;
  isSyncField?: boolean;
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
  // Data source configuration (for select, radio, autocomplete, multiselect)
  dataSourceType?: DataSourceType;
  dataSourceConfig?: DataSourceConfig;
  // Validation rules
  validationRules?: ValidationRules;
  // Attachment configuration
  attachmentConfig?: AttachmentConfig;
  // Additional metadata
  metadata?: {
    size?: number;
    decimals?: number;
    mask?: string;
    lookup?: string;
    validation?: string;
    when?: string;
    defaultValue?: string;
    options?: string[]; // Legacy: for simple select options
  };
  placeholder?: string;
  helpText?: string;
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
  approverGroupIds?: string[];
  editableFields?: string[];
  isParallel: boolean;
  conditions?: any;
  createdAt: string;
  updatedAt: string;
  // Enriched data (from snapshot)
  approvers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  approverGroups?: Array<{
    id: string;
    name: string;
    description?: string;
    members: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  }>;
};
