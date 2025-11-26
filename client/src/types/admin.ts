// ==========================================
// FORM TEMPLATES
// ==========================================

export interface FormField {
  id: string;
  templateId: string;
  sx3FieldName: string;
  label: string;
  fieldType: string;
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

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  tableName: string;
  isActive: boolean;
  fields?: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormTemplateDto {
  name: string;
  description?: string;
  tableName: string;
  isActive?: boolean;
}

export interface UpdateFormTemplateDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ReorderFieldsDto {
  fieldOrders: Array<{
    fieldId: string;
    newOrder: number;
  }>;
}

// ==========================================
// WORKFLOWS
// ==========================================

export interface ApprovalStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  approverEmail: string;
  approverName?: string;
  approverRole?: string;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  isActive: boolean;
  requiresSequentialApproval: boolean;
  steps?: ApprovalStep[];
  template?: FormTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowDto {
  templateId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  requiresSequentialApproval?: boolean;
  steps: Array<{
    stepOrder: number;
    approverEmail: string;
    approverName?: string;
    approverRole?: string;
    isRequired?: boolean;
  }>;
}

// ==========================================
// SX3 STRUCTURE
// ==========================================

export interface SX3Field {
  fieldName: string;
  label: string;
  fieldType: string;
  size: number;
  decimals?: number;
  isRequired: boolean;
  mask?: string;
  lookup?: string;
  validation?: string;
  when?: string;
  defaultValue?: string;
}

export interface SX3TableStructure {
  tableName: string;
  fields: SX3Field[];
}
