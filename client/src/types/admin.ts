// ==========================================
// FORM TEMPLATES
// ==========================================

// NOTE: FormTemplate and FormField are defined in ./registration.ts
// Import them from there to avoid duplication

export interface CreateFormTemplateDto {
  label: string;
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
