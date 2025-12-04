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
  tableName?: string; // Deprecated for multi-table, use tables instead
  label: string;
  description?: string;
  isActive: boolean;
  isMultiTable?: boolean; // true = uses TemplateTable, false = uses tableName
  allowBulkImport?: boolean; // true = allows bulk import via Excel/CSV
  bulkKeyFields?: string[]; // Fields used to identify existing records (e.g., ["A1_COD", "A1_LOJA"])
  tables?: TemplateTable[]; // Multi-table configuration
  fields?: FormField[];
  countryId?: string; // Country associated with the template
  country?: {
    id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// TEMPLATE TABLE (Multi-Table Support)
// ==========================================

export type TableRelationType = 'parent' | 'child' | 'independent';

export interface ForeignKeyField {
  parentField: string; // Field in parent table (e.g., DA0_CODTAB)
  childField: string; // Field in child table (e.g., DA1_CODTAB)
}

export interface ForeignKeyConfig {
  fields: ForeignKeyField[]; // Array of FK field pairs (supports composite keys)
}

export interface TemplateTable {
  id: string;
  templateId: string;
  tableName: string; // DA0, DA1, SA1, etc.
  alias: string; // "header", "items", "main"
  label: string; // "Cabeçalho", "Itens"
  tableOrder: number;
  relationType?: TableRelationType;
  parentTableId?: string;
  parentTable?: TemplateTable;
  foreignKeyConfig?: ForeignKeyConfig;
  fields?: FormField[];
  isActive: boolean;
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
  | 'attachment'
  | 'lookup';

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
  lookup: 'Lookup (Pesquisa)',
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

// ==========================================
// LOOKUP CONFIGURATION (SQL-Based)
// ==========================================

export interface LookupConfig {
  // SQL Query that returns data for the lookup
  // Example: "SELECT A1_COD, A1_NOME, A1_CGC FROM SA1010 WHERE D_E_L_E_T_ = '' AND A1_MSBLQL <> '1'"
  sqlQuery?: string;

  // Column name to use as stored value (e.g., A1_COD)
  valueField?: string;

  // Column name to display in the input field (e.g., A1_NOME)
  displayField?: string;

  // Optional: Columns to search when user types (defaults to all columns)
  searchableFields?: string[];

  // Optional: Auto-fill other form fields when a record is selected
  // Format: { "sourceColumn": "targetFieldName" }
  // Example: { "A1_NOME": "cliente_nome", "A1_CGC": "cliente_cnpj" }
  returnFields?: Record<string, string>;

  // Optional: Modal title (defaults to field label)
  modalTitle?: string;

  // Optional: Show all columns in results or just valueField + displayField
  showAllColumns?: boolean;
}

export interface LookupSearchResponse {
  data: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}

export interface LookupRecordResponse {
  data: Record<string, any> | null;
  found: boolean;
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
  tableId?: string; // Links to TemplateTable (for multi-table templates)
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
  // Lookup configuration (for lookup type)
  lookupConfig?: LookupConfig;
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

export type OperationType = 'NEW' | 'ALTERATION';

export type RegistrationRequest = {
  id: string;
  trackingNumber?: string;  // Sequential tracking number (e.g., "2025-00001")
  templateId: string;
  template?: FormTemplate;
  tableName: string;
  countryId?: string; // Country associated with the registration
  country?: {
    id: string;
    code: string;
    name: string;
  };
  requestedById: string;
  requestedBy?: {
    id: string;
    name: string;
    email: string;
  };
  requestedByEmail: string;
  requestedAt: string;
  formData: Record<string, any>;
  operationType?: OperationType;
  originalRecno?: string;
  originalFormData?: Record<string, any>;
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

// ==========================================
// MULTI-TABLE FORM DATA
// ==========================================

/**
 * Form data structure for multi-table templates
 * - Single table: { fieldName: value, ... }
 * - Multi-table: { tableAlias: { fieldName: value } | [{ fieldName: value }] }
 *
 * Example for DA0 (header) + DA1 (items):
 * {
 *   header: { DA0_CODTAB: "001", DA0_DESCRI: "Tabela Principal" },
 *   items: [
 *     { DA1_CODPRO: "PROD001", DA1_PRCVEN: 100.00 },
 *     { DA1_CODPRO: "PROD002", DA1_PRCVEN: 150.00 }
 *   ]
 * }
 */
export type MultiTableFormData = {
  [tableAlias: string]: Record<string, any> | Record<string, any>[];
};

/**
 * Table sync data - tracks sync results per table
 * Example:
 * {
 *   header: { recno: "123", syncedAt: "2024-01-01T10:00:00Z" },
 *   items: [{ recno: "456" }, { recno: "457" }]
 * }
 */
export type TableSyncData = {
  [tableAlias: string]: { recno: string; syncedAt?: string } | { recno: string }[];
};

// ==========================================
// TEMPLATE TABLE DTOs (for API calls)
// ==========================================

export interface CreateTemplateTableDto {
  tableName: string;
  alias: string;
  label: string;
  tableOrder?: number;
  relationType?: TableRelationType;
  parentTableId?: string;
  foreignKeyConfig?: ForeignKeyConfig;
  isActive?: boolean;
}

export interface UpdateTemplateTableDto {
  alias?: string;
  label?: string;
  tableOrder?: number;
  relationType?: TableRelationType;
  parentTableId?: string;
  foreignKeyConfig?: ForeignKeyConfig;
  isActive?: boolean;
}

export interface CreateMultiTableTemplateDto {
  label: string;
  description?: string;
  isActive?: boolean;
  tables: CreateTemplateTableDto[];
}

// ==========================================
// BULK IMPORT TYPES
// ==========================================

/**
 * Error detail for a specific row in bulk import
 */
export interface BulkImportError {
  row: number;
  field: string;
  fieldLabel?: string;
  value?: any;
  message: string;
}

/**
 * Warning for bulk import (non-blocking)
 */
export interface BulkImportWarning {
  type: 'info' | 'warning';
  message: string;
  row?: number;
  field?: string;
}

/**
 * Result of bulk import validation
 */
export interface BulkValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: BulkImportError[];
  warnings: BulkImportWarning[];
  preview?: {
    headers: string[];
    rows: Record<string, any>[];
  };
}

/**
 * Result of bulk import creation
 */
export interface BulkImportResult {
  success: boolean;
  registrationId?: string;
  trackingNumber?: string;
  itemCount: number;
  errors: BulkImportError[];
  warnings: BulkImportWarning[];
}

/**
 * Result of bulk submit
 */
export interface BulkSubmitResult {
  totalRequested: number;
  successful: number;
  failed: number;
  results: {
    registrationId: string;
    success: boolean;
    trackingNumber?: string;
    error?: string;
  }[];
}

// ==========================================
// SMART BULK IMPORT TYPES
// ==========================================

/**
 * Operation type for smart bulk import
 */
export type BulkOperationType = 'NEW' | 'ALTERATION' | 'ERROR';

/**
 * Information about a record in smart bulk import
 */
export interface BulkRecordInfo {
  index: number;
  rowNumber: number;
  operationType: BulkOperationType;
  exists: boolean;
  recno?: string;
  originalData?: Record<string, any>;
  keyValues?: Record<string, any>;
  error?: string;
}

/**
 * Result of smart bulk import validation with record details
 */
export interface BulkValidationResultWithRecords extends BulkValidationResult {
  records: BulkRecordInfo[];
  summary: {
    newRecords: number;
    alterations: number;
    errors: number;
  };
  hasKeyFields: boolean;
  keyFields?: string[];
}

/**
 * Result of smart bulk import (separated by operation type)
 */
export interface BulkImportResultSeparated {
  success: boolean;
  newRegistration?: {
    id: string;
    trackingNumber?: string;
    itemCount: number;
  };
  alterationRegistration?: {
    id: string;
    trackingNumber?: string;
    itemCount: number;
  };
  totalItems: number;
  errors: BulkImportError[];
  warnings: BulkImportWarning[];
}
