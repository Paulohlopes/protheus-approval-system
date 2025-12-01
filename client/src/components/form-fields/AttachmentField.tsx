import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  FormControl,
  FormHelperText,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Download,
  Image,
  PictureAsPdf,
  InsertDriveFile,
  Description,
  TableChart,
} from '@mui/icons-material';
import { uploadService } from '../../services/uploadService';
import type { FormField, FieldAttachment, AttachmentConfig } from '../../types/registration';

interface AttachmentFieldProps {
  field: FormField;
  registrationId: string;
  attachments: FieldAttachment[];
  onAttachmentsChange: (attachments: FieldAttachment[]) => void;
  error?: string;
  disabled?: boolean;
}

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;

export const AttachmentField: React.FC<AttachmentFieldProps> = ({
  field,
  registrationId,
  attachments = [],
  onAttachmentsChange,
  error,
  disabled,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const config: Required<AttachmentConfig> = {
    allowedTypes: field.attachmentConfig?.allowedTypes || DEFAULT_ALLOWED_TYPES,
    maxSize: field.attachmentConfig?.maxSize || DEFAULT_MAX_SIZE,
    maxFiles: field.attachmentConfig?.maxFiles || DEFAULT_MAX_FILES,
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimeType.startsWith('image/')) return <Image color="primary" />;
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <Description color="info" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return <TableChart color="success" />;
    return <InsertDriveFile />;
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check total files limit
      if (attachments.length + files.length > config.maxFiles) {
        setUploadError(`Limite de ${config.maxFiles} arquivos atingido`);
        e.target.value = '';
        return;
      }

      setUploading(true);
      setUploadError(null);

      const newAttachments: FieldAttachment[] = [];

      for (const file of Array.from(files)) {
        try {
          const attachment = await uploadService.uploadFile(
            file,
            registrationId,
            field.fieldName || field.sx3FieldName || field.id,
            config,
          );
          newAttachments.push(attachment);
        } catch (err: any) {
          setUploadError(err.message || 'Erro ao fazer upload');
          break;
        }
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
      }

      setUploading(false);
      e.target.value = '';
    },
    [registrationId, field, attachments, config, onAttachmentsChange],
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      try {
        await uploadService.deleteFile(attachmentId);
        onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
      } catch (err: any) {
        setUploadError(err.message || 'Erro ao deletar arquivo');
      }
    },
    [attachments, onAttachmentsChange],
  );

  const canUploadMore = attachments.length < config.maxFiles;

  const getAcceptString = () => {
    return config.allowedTypes.join(',');
  };

  const getAllowedTypesDisplay = () => {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    };
    return config.allowedTypes.map((t) => typeMap[t] || t.split('/')[1]).join(', ');
  };

  return (
    <FormControl fullWidth error={!!error}>
      <Typography variant="subtitle2" gutterBottom>
        {field.label}
        {field.isRequired && <span style={{ color: 'red' }}> *</span>}
      </Typography>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <List dense sx={{ mb: 1 }}>
          {attachments.map((attachment) => (
            <ListItem
              key={attachment.id}
              sx={{
                bgcolor: 'grey.100',
                mb: 0.5,
                borderRadius: 1,
              }}
            >
              <ListItemIcon>{getFileIcon(attachment.mimeType)}</ListItemIcon>
              <ListItemText
                primary={attachment.originalName}
                secondary={uploadService.formatFileSize(attachment.fileSize)}
                primaryTypographyProps={{ noWrap: true }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => uploadService.downloadFile(attachment.id)}
                  title="Download"
                >
                  <Download fontSize="small" />
                </IconButton>
                {!disabled && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(attachment.id)}
                    title="Remover"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Upload Button */}
      {!disabled && canUploadMore && (
        <Box sx={{ mt: 1 }}>
          <input
            accept={getAcceptString()}
            style={{ display: 'none' }}
            id={`upload-${field.id}`}
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor={`upload-${field.id}`}>
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              disabled={uploading}
              size="small"
            >
              {attachments.length === 0 ? 'Adicionar Arquivo' : 'Adicionar Mais'}
            </Button>
          </label>

          {uploading && <LinearProgress sx={{ mt: 1 }} />}
        </Box>
      )}

      {/* Info */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Tipos: {getAllowedTypesDisplay()} | Max: {uploadService.formatFileSize(config.maxSize)} |{' '}
          {attachments.length}/{config.maxFiles} arquivos
        </Typography>
      </Box>

      {/* Errors */}
      {(error || uploadError) && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setUploadError(null)}>
          {error || uploadError}
        </Alert>
      )}

      {field.helpText && !error && !uploadError && (
        <FormHelperText>{field.helpText}</FormHelperText>
      )}
    </FormControl>
  );
};
