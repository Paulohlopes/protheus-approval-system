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
  countryId?: string; // Country for SX3 lookup
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

export interface WorkflowLevel {
  id: string;
  workflowId: string;
  levelOrder: number;
  levelName?: string;
  approverIds?: string[];
  approverGroupIds?: string[];
  editableFields?: string[];
  isParallel?: boolean;
  conditions?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  isActive: boolean;
  levels?: WorkflowLevel[];
  template?: FormTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowLevelDto {
  levelOrder: number;
  levelName?: string;
  approverIds?: string[];
  approverGroupIds?: string[];
  editableFields?: string[];
  isParallel?: boolean;
  conditions?: any;
}

export interface CreateWorkflowDto {
  templateId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  levels: WorkflowLevelDto[];
}

// ==========================================
// APPROVAL GROUPS
// ==========================================

export interface ApprovalGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  members?: ApprovalGroupMember[];
  _count?: {
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalGroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
    department?: string;
  };
  addedAt: string;
}

export interface UserOption {
  id: string;
  name: string;
  email: string;
  username: string;
  department?: string;
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
