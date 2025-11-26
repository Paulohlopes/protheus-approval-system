import api from './api';
import type {
  FormTemplate,
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
  ReorderFieldsDto,
  Workflow,
  CreateWorkflowDto,
} from '../types/admin';

export const adminService = {
  // ==========================================
  // FORM TEMPLATES
  // ==========================================

  /**
   * Get all form templates
   */
  async getTemplates(includeFields = true): Promise<FormTemplate[]> {
    const response = await api.get('/form-template', {
      params: { includeFields },
    });
    return response.data;
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<FormTemplate> {
    const response = await api.get(`/form-template/${id}`);
    return response.data;
  },

  /**
   * Get template by table name
   */
  async getTemplateByTable(tableName: string): Promise<FormTemplate> {
    const response = await api.get(`/form-template/by-table/${tableName}`);
    return response.data;
  },

  /**
   * Create a new form template
   */
  async createTemplate(data: CreateFormTemplateDto): Promise<FormTemplate> {
    const response = await api.post('/form-template', data);
    return response.data;
  },

  /**
   * Update a form template
   */
  async updateTemplate(id: string, data: UpdateFormTemplateDto): Promise<FormTemplate> {
    const response = await api.put(`/form-template/${id}`, data);
    return response.data;
  },

  /**
   * Delete a form template
   */
  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/form-template/${id}`);
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
    const response = await api.put(`/form-template/${templateId}/fields/${fieldId}`, data);
    return response.data;
  },

  /**
   * Reorder fields in a template
   */
  async reorderTemplateFields(templateId: string, data: ReorderFieldsDto): Promise<FormTemplate> {
    const response = await api.post(`/form-template/${templateId}/reorder`, data);
    return response.data;
  },

  /**
   * Get visible fields only
   */
  async getVisibleFields(templateId: string): Promise<any[]> {
    const response = await api.get(`/form-template/${templateId}/visible-fields`);
    return response.data;
  },

  /**
   * Sync template with SX3 (Protheus metadata)
   */
  async syncTemplateWithSx3(templateId: string): Promise<FormTemplate> {
    const response = await api.post(`/form-template/${templateId}/sync`);
    return response.data;
  },

  // ==========================================
  // WORKFLOWS
  // ==========================================

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    const response = await api.post('/registration/workflows', data);
    return response.data;
  },

  /**
   * Get active workflow for a template
   */
  async getActiveWorkflow(templateId: string): Promise<Workflow> {
    const response = await api.get(`/registration/workflows/template/${templateId}`);
    return response.data;
  },

  // ==========================================
  // SX3 INTEGRATION
  // ==========================================

  /**
   * Get table structure from SX3
   */
  async getTableStructure(tableName: string): Promise<any> {
    const response = await api.get(`/sx3/table/${tableName}`);
    return response.data;
  },

  /**
   * Get all available tables from SX3
   */
  async getAllTables(): Promise<string[]> {
    const response = await api.get('/sx3/tables');
    return response.data;
  },
};
