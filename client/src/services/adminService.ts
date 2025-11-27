import { backendApi } from './api';
import type { FormTemplate } from '../types/registration';
import type {
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
  ReorderFieldsDto,
  Workflow,
  CreateWorkflowDto,
  ApprovalGroup,
  UserOption,
} from '../types/admin';

export const adminService = {
  // ==========================================
  // FORM TEMPLATES
  // ==========================================

  /**
   * Get all form templates
   */
  async getTemplates(includeFields = true): Promise<FormTemplate[]> {
    const response = await backendApi.get('/form-templates', {
      params: { includeFields },
    });
    return response.data;
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<FormTemplate> {
    const response = await backendApi.get(`/form-templates/${id}`);
    return response.data;
  },

  /**
   * Get template by table name
   */
  async getTemplateByTable(tableName: string): Promise<FormTemplate> {
    const response = await backendApi.get(`/form-templates/by-table/${tableName}`);
    return response.data;
  },

  /**
   * Create a new form template
   */
  async createTemplate(data: CreateFormTemplateDto): Promise<FormTemplate> {
    const response = await backendApi.post('/form-templates', data);
    return response.data;
  },

  /**
   * Update a form template
   */
  async updateTemplate(id: string, data: UpdateFormTemplateDto): Promise<FormTemplate> {
    const response = await backendApi.put(`/form-templates/${id}`, data);
    return response.data;
  },

  /**
   * Delete a form template
   */
  async deleteTemplate(id: string): Promise<void> {
    await backendApi.delete(`/form-templates/${id}`);
  },

  /**
   * Update a specific field in a template
   */
  async updateTemplateField(
    templateId: string,
    fieldId: string,
    data: {
      isVisible?: boolean;
      isEnabled?: boolean;
      fieldGroup?: string;
      validationRules?: any;
    }
  ): Promise<FormTemplate> {
    const response = await backendApi.put(`/form-templates/${templateId}/fields/${fieldId}`, data);
    return response.data;
  },

  /**
   * Reorder fields in a template
   */
  async reorderTemplateFields(templateId: string, data: ReorderFieldsDto): Promise<FormTemplate> {
    const response = await backendApi.post(`/form-templates/${templateId}/reorder`, data);
    return response.data;
  },

  /**
   * Get visible fields only
   */
  async getVisibleFields(templateId: string): Promise<any[]> {
    const response = await backendApi.get(`/form-templates/${templateId}/visible-fields`);
    return response.data;
  },

  /**
   * Sync template with SX3 (Protheus metadata)
   */
  async syncTemplateWithSx3(templateId: string): Promise<FormTemplate> {
    const response = await backendApi.post(`/form-templates/${templateId}/sync`);
    return response.data;
  },

  /**
   * Create a custom field in a template
   */
  async createCustomField(
    templateId: string,
    data: {
      fieldName: string;
      label: string;
      fieldType: string;
      isRequired?: boolean;
      fieldGroup?: string;
      placeholder?: string;
      helpText?: string;
      metadata?: any;
    }
  ): Promise<FormTemplate> {
    const response = await backendApi.post(`/form-templates/${templateId}/custom-fields`, data);
    return response.data;
  },

  /**
   * Delete a field from a template
   */
  async deleteTemplateField(templateId: string, fieldId: string): Promise<void> {
    await backendApi.delete(`/form-templates/${templateId}/fields/${fieldId}`);
  },

  // ==========================================
  // WORKFLOWS
  // ==========================================

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    const response = await backendApi.post('/registrations/workflows', data);
    return response.data;
  },

  /**
   * Get active workflow for a template
   */
  async getActiveWorkflow(templateId: string): Promise<Workflow> {
    const response = await backendApi.get(`/registrations/workflows/template/${templateId}`);
    return response.data;
  },

  // ==========================================
  // SX3 INTEGRATION
  // ==========================================

  /**
   * Get table structure from SX3
   */
  async getTableStructure(tableName: string): Promise<any> {
    const response = await backendApi.get(`/sx3/table/${tableName}`);
    return response.data;
  },

  /**
   * Get all available tables from SX3
   */
  async getAllTables(): Promise<string[]> {
    const response = await backendApi.get('/sx3/tables');
    return response.data;
  },

  // ==========================================
  // USERS
  // ==========================================

  /**
   * Get all users for selection dropdowns
   */
  async getUsers(): Promise<UserOption[]> {
    const response = await backendApi.get('/approval-groups/users/all');
    return response.data;
  },

  // ==========================================
  // APPROVAL GROUPS
  // ==========================================

  /**
   * Get all approval groups
   */
  async getApprovalGroups(includeInactive = false): Promise<ApprovalGroup[]> {
    const response = await backendApi.get('/approval-groups', {
      params: { includeInactive },
    });
    return response.data;
  },

  /**
   * Get a single approval group by ID
   */
  async getApprovalGroup(id: string): Promise<ApprovalGroup> {
    const response = await backendApi.get(`/approval-groups/${id}`);
    return response.data;
  },

  /**
   * Create a new approval group
   */
  async createApprovalGroup(data: { name: string; description?: string }): Promise<ApprovalGroup> {
    const response = await backendApi.post('/approval-groups', data);
    return response.data;
  },

  /**
   * Update an approval group
   */
  async updateApprovalGroup(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<ApprovalGroup> {
    const response = await backendApi.put(`/approval-groups/${id}`, data);
    return response.data;
  },

  /**
   * Delete an approval group
   */
  async deleteApprovalGroup(id: string): Promise<void> {
    await backendApi.delete(`/approval-groups/${id}`);
  },

  /**
   * Add a member to an approval group
   */
  async addGroupMember(groupId: string, userId: string): Promise<any> {
    const response = await backendApi.post(`/approval-groups/${groupId}/members`, { userId });
    return response.data;
  },

  /**
   * Remove a member from an approval group
   */
  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await backendApi.delete(`/approval-groups/${groupId}/members/${userId}`);
  },

  /**
   * Get members of an approval group
   */
  async getGroupMembers(groupId: string): Promise<any[]> {
    const response = await backendApi.get(`/approval-groups/${groupId}/members`);
    return response.data;
  },
};
