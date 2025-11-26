import axios from 'axios';
import type {
  FormTemplate,
  RegistrationRequest,
  RegistrationWorkflow,
} from '../types/registration';
import { RegistrationStatus } from '../types/registration';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registrationService = {
  // ==========================================
  // FORM TEMPLATES
  // ==========================================

  /**
   * Get all form templates
   */
  async getTemplates(includeFields = false): Promise<FormTemplate[]> {
    const response = await api.get('/form-templates', {
      params: { includeFields },
    });
    return response.data;
  },

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<FormTemplate> {
    const response = await api.get(`/form-templates/${id}`);
    return response.data;
  },

  /**
   * Get template by table name
   */
  async getTemplateByTableName(tableName: string): Promise<FormTemplate> {
    const response = await api.get(`/form-templates/by-table/${tableName}`);
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
    const response = await api.post('/form-templates', data);
    return response.data;
  },

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: { label?: string; description?: string; isActive?: boolean },
  ): Promise<FormTemplate> {
    const response = await api.put(`/form-templates/${id}`, data);
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
    const response = await api.put(`/form-templates/${templateId}/fields/${fieldId}`, data);
    return response.data;
  },

  /**
   * Reorder fields
   */
  async reorderFields(templateId: string, fieldIds: string[]): Promise<FormTemplate> {
    const response = await api.post(`/form-templates/${templateId}/reorder`, { fieldIds });
    return response.data;
  },

  /**
   * Get visible fields for form
   */
  async getVisibleFields(templateId: string): Promise<any[]> {
    const response = await api.get(`/form-templates/${templateId}/visible-fields`);
    return response.data;
  },

  /**
   * Sync template with SX3
   */
  async syncTemplateWithSx3(templateId: string): Promise<FormTemplate> {
    const response = await api.post(`/form-templates/${templateId}/sync`);
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
    const response = await api.post('/registrations/workflows', data);
    return response.data;
  },

  /**
   * Get active workflow for template
   */
  async getActiveWorkflow(templateId: string): Promise<RegistrationWorkflow> {
    const response = await api.get(`/registrations/workflows/template/${templateId}`);
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
  }): Promise<RegistrationRequest> {
    const response = await api.post('/registrations', data);
    return response.data;
  },

  /**
   * Update draft registration
   */
  async updateRegistration(
    id: string,
    formData: Record<string, any>,
  ): Promise<RegistrationRequest> {
    const response = await api.put(`/registrations/${id}`, { formData });
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
    const response = await api.get('/registrations', { params: filters });
    return response.data;
  },

  /**
   * Get registration by ID
   */
  async getRegistration(id: string): Promise<RegistrationRequest> {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  },

  /**
   * Delete draft registration
   */
  async deleteRegistration(id: string): Promise<void> {
    await api.delete(`/registrations/${id}`);
  },

  /**
   * Submit registration for approval
   */
  async submitRegistration(id: string): Promise<RegistrationRequest> {
    const response = await api.post(`/registrations/${id}/submit`);
    return response.data;
  },

  /**
   * Approve registration
   */
  async approveRegistration(id: string, comments?: string): Promise<RegistrationRequest> {
    const response = await api.post(`/registrations/${id}/approve`, { comments });
    return response.data;
  },

  /**
   * Reject registration
   */
  async rejectRegistration(id: string, reason: string): Promise<RegistrationRequest> {
    const response = await api.post(`/registrations/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Get pending approvals for current user
   */
  async getPendingApprovals(approverId: string): Promise<RegistrationRequest[]> {
    const response = await api.get('/registrations/pending-approval', {
      params: { approverId },
    });
    return response.data;
  },

  /**
   * Retry sync to Protheus
   */
  async retrySync(id: string): Promise<RegistrationRequest> {
    const response = await api.post(`/registrations/${id}/retry-sync`);
    return response.data;
  },

  // ==========================================
  // SX3
  // ==========================================

  /**
   * Get table structure from SX3
   */
  async getTableStructure(tableName: string): Promise<any> {
    const response = await api.get(`/sx3/tables/${tableName}/fields`);
    return response.data;
  },

  /**
   * Get available tables
   */
  async getAvailableTables(): Promise<{ tables: string[] }> {
    const response = await api.get('/sx3/tables');
    return response.data;
  },

  /**
   * Sync SX3 cache
   */
  async syncSx3Cache(): Promise<void> {
    await api.post('/sx3/sync');
  },
};
