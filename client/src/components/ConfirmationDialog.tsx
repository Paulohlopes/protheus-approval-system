import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
  Typography,
  Alert,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comments?: string) => void;
  action: 'approve' | 'reject';
  documentNumber?: string;
  documentValue?: string;
  loading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = React.memo(({
  open,
  onClose,
  onConfirm,
  action,
  documentNumber,
  documentValue,
  loading = false,
}) => {
  const [comments, setComments] = useState('');
  const isApprove = action === 'approve';

  const handleClose = () => {
    setComments('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(comments.trim() || undefined);
    setComments('');
  };
  
  const getActionConfig = () => {
    if (isApprove) {
      return {
        title: 'Confirmar Aprovação',
        message: 'Você tem certeza que deseja aprovar este documento?',
        warning: 'Esta ação não pode ser desfeita após a confirmação.',
        icon: <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />,
        confirmButtonText: 'Aprovar Documento',
        confirmButtonColor: 'success' as const,
        severity: 'info' as const,
      };
    } else {
      return {
        title: 'Confirmar Rejeição',
        message: 'Você tem certeza que deseja rejeitar este documento?',
        warning: 'Esta ação não pode ser desfeita e o documento será devolvido ao solicitante.',
        icon: <Cancel sx={{ fontSize: 48, color: 'error.main' }} />,
        confirmButtonText: 'Rejeitar Documento',
        confirmButtonColor: 'error' as const,
        severity: 'warning' as const,
      };
    }
  };

  const config = getActionConfig();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {config.icon}
          <Typography variant="h6" component="span">
            {config.title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description" sx={{ mb: 2 }}>
          {config.message}
        </DialogContentText>
        
        {documentNumber && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Documento:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {documentNumber}
            </Typography>
            {documentValue && (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                  Valor:
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="primary">
                  {documentValue}
                </Typography>
              </>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label={isApprove ? 'Observações da aprovação (opcional)' : 'Motivo da rejeição (opcional)'}
          placeholder={isApprove ? 'Digite observações sobre a aprovação...' : 'Digite o motivo da rejeição...'}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={loading}
          sx={{ mt: 2, mb: 2 }}
          variant="outlined"
        />
        
        <Alert severity={config.severity}>
          <Typography variant="body2">
            <Warning sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
            {config.warning}
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
          size="large"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={config.confirmButtonColor}
          disabled={loading}
          size="large"
          autoFocus
          startIcon={loading ? null : (isApprove ? <CheckCircle /> : <Cancel />)}
        >
          {loading ? 'Processando...' : config.confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ConfirmationDialog.displayName = 'ConfirmationDialog';

export default ConfirmationDialog;