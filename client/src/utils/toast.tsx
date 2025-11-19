import React from 'react';
import { toast as reactToast, ToastOptions, ToastContent, Id } from 'react-toastify';
import { Box, Button, Typography, Stack, IconButton } from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  Undo,
} from '@mui/icons-material';

interface CustomToastOptions extends ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  undoAction?: () => void;
}

const ToastContent: React.FC<{
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  undoAction?: () => void;
  closeToast?: () => void;
}> = ({ message, type, action, undoAction, closeToast }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: '#4caf50', fontSize: 24 }} />;
      case 'error':
        return <Error sx={{ color: '#f44336', fontSize: 24 }} />;
      case 'warning':
        return <Warning sx={{ color: '#ff9800', fontSize: 24 }} />;
      case 'info':
        return <Info sx={{ color: '#2196f3', fontSize: 24 }} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
      {getIcon()}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
          {message}
        </Typography>
        {(action || undoAction) && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {undoAction && (
              <Button
                size="small"
                variant="text"
                startIcon={<Undo sx={{ fontSize: 16 }} />}
                onClick={() => {
                  undoAction();
                  closeToast?.();
                }}
                sx={{
                  color: 'inherit',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  minHeight: 0,
                  py: 0.5,
                  px: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Desfazer
              </Button>
            )}
            {action && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  action.onClick();
                  closeToast?.();
                }}
                sx={{
                  color: 'inherit',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  minHeight: 0,
                  py: 0.5,
                  px: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                {action.label}
              </Button>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const toast = {
  success: (message: string, options?: CustomToastOptions): Id => {
    return reactToast.success(
      ({ closeToast }) => (
        <ToastContent
          message={message}
          type="success"
          action={options?.action}
          undoAction={options?.undoAction}
          closeToast={closeToast}
        />
      ),
      {
        ...defaultOptions,
        ...options,
        icon: false,
      }
    );
  },

  error: (message: string, options?: CustomToastOptions): Id => {
    return reactToast.error(
      ({ closeToast }) => (
        <ToastContent
          message={message}
          type="error"
          action={options?.action}
          closeToast={closeToast}
        />
      ),
      {
        ...defaultOptions,
        ...options,
        autoClose: 7000, // Longer for errors
        icon: false,
      }
    );
  },

  warning: (message: string, options?: CustomToastOptions): Id => {
    return reactToast.warning(
      ({ closeToast }) => (
        <ToastContent
          message={message}
          type="warning"
          action={options?.action}
          closeToast={closeToast}
        />
      ),
      {
        ...defaultOptions,
        ...options,
        icon: false,
      }
    );
  },

  info: (message: string, options?: CustomToastOptions): Id => {
    return reactToast.info(
      ({ closeToast }) => (
        <ToastContent
          message={message}
          type="info"
          action={options?.action}
          closeToast={closeToast}
        />
      ),
      {
        ...defaultOptions,
        ...options,
        icon: false,
      }
    );
  },

  promise: reactToast.promise,
  dismiss: reactToast.dismiss,
  isActive: reactToast.isActive,
  update: reactToast.update,
};

export default toast;
