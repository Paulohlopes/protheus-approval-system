import { backendApi } from './api';
import type {
  FormTemplate,
  RegistrationRequest,
  RegistrationWorkflow,
  BulkValidationResult,
  BulkValidationResultWithRecords,
  BulkImportResult,
  BulkImportResultSeparated,
  BulkSubmitResult,
} from '../types/registration';
import type { RegistrationStatus } from '../types/registration';

// Use the centralized backendApi instance with proper auth handling

export const registrationService = {
  // ==========================================
  // FORM TEMPLATES
  // ==========================================

  /**
   * Get all form templates
   */
  async getTemplates(includeFields = false): Promise<FormTemplate[]> {
    const response = await backendApi.get('/form-templates', {
      params: { includeFields },
    });
    return response.data;
  },

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<FormTemplate> {
    const response = await backendApi.get(`/form-templates/${id}`);
    return response.data;
  },

  /**
   * Get template by table name
   */
  async getTemplateByTableName(tableName: string): Promise<FormTemplate> {
    const response = await backendApi.get(`/form-templates/by-table/${tableName}`);
    return response.data;
  },

  /**
   * Create template from SX3
   */
  async createTemplate(data: {
    tableName: string;
    label: string;
    description?: string;
  }): Promise<FormTemplate> {
    const response = await backendApi.post('/form-templates', data);
    return response.data;
  },

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: { label?: string; description?: string; isActive?: boolean },
  ): Promise<FormTemplate> {
    const response = await backendApi.put(`/form-templates/${id}`, data);
    return response.data;
  },

  /**
   * Update field visibility/order
   */
  async updateField(
    templateId: string,
    fieldId: string,
    data: {
      isVisible?: boolean;
      isEnabled?: boolean;
      fieldOrder?: number;
      fieldGroup?: string;
    },
  ): Promise<any> {
    const response = await backendApi.put(`/form-templates/${templateId}/fields/${fieldId}`, data);
    return response.data;
  },

  /**
   * Reorder fields
   */
  async reorderFields(templateId: string, fieldIds: string[]): Promise<FormTemplate> {
    const response = await backendApi.post(`/form-templates/${templateId}/reorder`, { fieldIds });
    return response.data;
  },

  /**
   * Get visible fields for form
   */
  async getVisibleFields(templateId: string): Promise<any[]> {
    const response = await backendApi.get(`/form-templates/${templateId}/visible-fields`);
    return response.data;
  },

  /**
   * Sync template with SX3
   */
  async syncTemplateWithSx3(templateId: string): Promise<FormTemplate> {
    const response = await backendApi.post(`/form-templates/${templateId}/sync`);
    return response.data;
  },

  // ==========================================
  // WORKFLOWS
  // ==========================================

  /**
   * Create workflow
   */
  async createWorkflow(data: {
    templateId: string;
    name: string;
    description?: string;
    levels: Array<{
      levelOrder: number;
      levelName?: string;
      approverIds: string[];
      isParallel?: boolean;
    }>;
  }): Promise<RegistrationWorkflow> {
    const response = await backendApi.post('/registrations/workflows', data);
    return response.data;
  },

  /**
   * Get active workflow for template
   */
  async getActiveWorkflow(templateId: string): Promise<RegistrationWorkflow> {
    const response = await backendApi.get(`/registrations/workflows/template/${templateId}`);
    return response.data;
  },

  // ==========================================
  // REGISTRATIONS
  // ==========================================

  /**
   * Create draft registration
   */
  async createRegistration(data: {
    templateId: string;
    formData: Record<string, any>;
    countryId?: string;
  }): Promise<RegistrationRequest> {
    const response = await backendApi.post('/registrations', data);
    return response.data;
  },

  /**
   * Update draft registration
   */
  async updateRegistration(
    id: string,
    formData: Record<string, any>,
  ): Promise<RegistrationRequest> {
    const response = await backendApi.put(`/registrations/${id}`, { formData });
    return response.data;
  },

  /**
   * Get all registrations
   */
  async getRegistrations(filters?: {
    status?: RegistrationStatus;
    requestedById?: string;
    templateId?: string;
  }): Promise<RegistrationRequest[]> {
    const response = await backendApi.get('/registrations', { params: filters });
    return response.data;
  },

  /**
   * Get my requests (uses authenticated user from token)
   * More secure than passing requestedById from frontend
   */
  async getMyRequests(): Promise<RegistrationRequest[]> {
    const response = await backendApi.get('/registrations/my-requests');
    return response.data;
  },

  /**
   * Get registration by ID
   */
  async getRegistration(id: string): Promise<RegistrationRequest> {
    const response = await backendApi.get(`/registrations/${id}`);
    return response.data;
  },

  /**
   * Delete draft registration
   */
  async deleteRegistration(id: string): Promise<void> {
    await backendApi.delete(`/registrations/${id}`);
  },

  /**
   * Submit registration for approval
   */
  async submitRegistration(id: string): Promise<RegistrationRequest> {
    const response = await backendApi.post(`/registrations/${id}/submit`);
    return response.data;
  },

  /**
   * Approve registration (with optional field changes)
   */
  async approveRegistration(
    id: string,
    comments?: string,
    fieldChanges?: Record<string, any>,
  ): Promise<RegistrationRequest> {
    const response = await backendApi.post(`/registrations/${id}/approve`, {
      comments,
      fieldChanges,
    });
    return response.data;
  },

  /**
   * Reject registration
   */
  async rejectRegistration(id: string, reason: string): Promise<RegistrationRequest> {
    const response = await backendApi.post(`/registrations/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Send back registration to previous level or to requester (draft)
   * @param id - Registration ID
   * @param reason - Reason for sending back
   * @param targetLevel - Target level (0 = return to draft, undefined = previous level)
   */
  async sendBackRegistration(
    id: string,
    reason: string,
    targetLevel?: number,
  ): Promise<RegistrationRequest> {
    const response = await backendApi.post(`/registrations/${id}/send-back`, {
      reason,
      targetLevel,
    });
    return response.data;
  },

  /**
   * Get pending approvals for current user
   */
  async getPendingApprovals(approverId: string): Promise<RegistrationRequest[]> {
    const response = await backendApi.get('/registrations/pending-approval', {
      params: { approverId },
    });
    return response.data;
  },

  /**
   * Retry sync to Protheus
   */
  async retrySync(id: string): Promise<RegistrationRequest> {
    const response = await backendApi.post(`/registrations/${id}/retry-sync`);
    return response.data;
  },

  // ==========================================
  // SX3
  // ==========================================

  /**
   * Get table structure from SX3
   */
  async getTableStructure(tableName: string): Promise<any> {
    const response = await backendApi.get(`/sx3/tables/${tableName}/fields`);
    return response.data;
  },

  /**
   * Get available tables
   */
  async getAvailableTables(): Promise<{ tables: string[] }> {
    const response = await backendApi.get('/sx3/tables');
    return response.data;
  },

  /**
   * Sync SX3 cache
   */
  async syncSx3Cache(): Promise<void> {
    await backendApi.post('/sx3/sync');
  },

  // ==========================================
  // FIELD CHANGE HISTORY
  // ==========================================

  /**
   * Get field change history for a registration
   */
  async getFieldChangeHistory(registrationId: string): Promise<FieldChangeHistory[]> {
    const response = await backendApi.get(`/registrations/${registrationId}/field-changes`);
    return response.data;
  },

  /**
   * Get editable fields info for current approval level
   */
  async getEditableFieldsInfo(registrationId: string): Promise<{
    editableFields: string[];
    currentLevel: number;
  }> {
    const response = await backendApi.get(`/registrations/${registrationId}/editable-fields`);
    return response.data;
  },

  // ==========================================
  // BULK IMPORT
  // ==========================================

  /**
   * Download bulk import template (Excel/CSV)
   */
  async downloadBulkTemplate(templateId: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
    const response = await backendApi.get(`/registrations/bulk/template/${templateId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Validate bulk import file before creating registration
   */
  async validateBulkFile(templateId: string, file: File): Promise<BulkValidationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateId', templateId);

    const response = await backendApi.post('/registrations/bulk/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Create bulk registration from file
   */
  async createBulkRegistration(
    templateId: string,
    file: File,
    countryId?: string,
  ): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateId', templateId);
    if (countryId) {
      formData.append('countryId', countryId);
    }

    const response = await backendApi.post('/registrations/bulk/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Submit multiple registrations at once
   */
  async submitBulkRegistrations(registrationIds: string[]): Promise<BulkSubmitResult> {
    const response = await backendApi.post('/registrations/bulk/submit', {
      registrationIds,
    });
    return response.data;
  },

  /**
   * Get templates that allow bulk import
   */
  async getBulkEnabledTemplates(): Promise<FormTemplate[]> {
    const response = await backendApi.get('/form-templates', {
      params: { includeFields: true },
    });
    // Filter only templates with allowBulkImport = true
    return response.data.filter((t: FormTemplate) => t.allowBulkImport);
  },

  /**
   * Validate bulk import file with smart detection (NEW vs ALTERATION)
   */
  async validateBulkFileSmart(templateId: string, file: File): Promise<BulkValidationResultWithRecords> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateId', templateId);

    const response = await backendApi.post('/registrations/bulk/validate-smart', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Create bulk registration with smart separation (NEW vs ALTERATION)
   */
  async createBulkRegistrationSmart(
    templateId: string,
    file: File,
    countryId?: string,
  ): Promise<BulkImportResultSeparated> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateId', templateId);
    if (countryId) {
      formData.append('countryId', countryId);
    }

    const response = await backendApi.post('/registrations/bulk/import-smart', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Types for field change history
export interface FieldChangeHistory {
  id: string;
  requestId: string;
  fieldName: string;
  previousValue?: string;
  newValue?: string;
  changedById: string;
  changedAt: string;
  approvalLevel: number;
  changedBy?: {
    id: string;
    name: string;
    email: string;
  };
}
