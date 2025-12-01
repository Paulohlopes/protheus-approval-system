import { backendApi } from './api';
import type { FieldAttachment, AttachmentConfig } from '../types/registration';

export const uploadService = {
  /**
   * Upload a file for a registration field
   */
  async uploadFile(
    file: File,
    registrationId: string,
    fieldName: string,
    config?: AttachmentConfig,
  ): Promise<FieldAttachment> {
    // Client-side validation
    if (config?.allowedTypes && config.allowedTypes.length > 0) {
      if (!config.allowedTypes.includes(file.type)) {
        throw new Error(
          `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${config.allowedTypes.join(', ')}`,
        );
      }
    }

    if (config?.maxSize && file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await backendApi.post(
      `/uploads/registrations/${registrationId}/fields/${fieldName}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  /**
   * Delete a file
   */
  async deleteFile(attachmentId: string): Promise<void> {
    await backendApi.delete(`/uploads/${attachmentId}`);
  },

  /**
   * Get attachments for a registration
   */
  async getAttachments(
    registrationId: string,
    fieldName?: string,
  ): Promise<FieldAttachment[]> {
    const params = fieldName ? { fieldName } : {};
    const response = await backendApi.get(
      `/uploads/registrations/${registrationId}`,
      { params },
    );
    return response.data;
  },

  /**
   * Get attachment info
   */
  async getAttachment(attachmentId: string): Promise<FieldAttachment> {
    const response = await backendApi.get(`/uploads/${attachmentId}`);
    return response.data;
  },

  /**
   * Get download URL for an attachment
   */
  getDownloadUrl(attachmentId: string): string {
    return `${backendApi.defaults.baseURL}/uploads/${attachmentId}/download`;
  },

  /**
   * Download a file (opens in new tab)
   */
  downloadFile(attachmentId: string): void {
    window.open(uploadService.getDownloadUrl(attachmentId), '_blank');
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): 'pdf' | 'image' | 'document' | 'spreadsheet' | 'file' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (
      mimeType.includes('word') ||
      mimeType.includes('document')
    )
      return 'document';
    if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet')
    )
      return 'spreadsheet';
    return 'file';
  },
};
