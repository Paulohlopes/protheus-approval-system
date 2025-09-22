import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  Assignment,
  Search,
  Refresh,
  ShoppingCart,
  ErrorOutline,
  CheckCircle,
  Folder,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface EmptyStateProps {
  type: 'no-documents' | 'no-results' | 'no-purchase-requests' | 'error' | 'success' | 'empty-folder';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const getEmptyStateConfig = (type: EmptyStateProps['type'], t?: any) => {
  switch (type) {
    case 'no-documents':
      return {
        icon: <Assignment sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />,
        title: t?.emptyState?.noDocumentsTitle || 'Nenhum documento pendente',
        description: t?.emptyState?.noDocumentsDesc || 'Não há documentos aguardando aprovação no momento. Que tal aproveitar para uma pausa? ☕',
      };

    case 'no-results':
      return {
        icon: <Search sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />,
        title: t?.emptyState?.noResultsTitle || 'Nenhum resultado encontrado',
        description: t?.emptyState?.noResultsDesc || 'Tente ajustar os filtros de busca ou limpar os filtros para ver todos os itens.',
      };

    case 'no-purchase-requests':
      return {
        icon: <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />,
        title: t?.emptyState?.noPurchaseRequestsTitle || 'Nenhuma solicitação de compra',
        description: t?.emptyState?.noPurchaseRequestsDesc || 'Não há solicitações de compra cadastradas no momento.',
      };

    case 'error':
      return {
        icon: <ErrorOutline sx={{ fontSize: 80, color: 'error.main' }} />,
        title: t?.emptyState?.errorTitle || 'Ops! Algo deu errado',
        description: t?.emptyState?.errorDesc || 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
      };

    case 'success':
      return {
        icon: <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />,
        title: t?.emptyState?.successTitle || 'Tudo certo!',
        description: t?.emptyState?.successDesc || 'A operação foi concluída com sucesso.',
      };

    case 'empty-folder':
    default:
      return {
        icon: <Folder sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />,
        title: t?.emptyState?.emptyFolderTitle || 'Pasta vazia',
        description: t?.emptyState?.emptyFolderDesc || 'Esta seção não possui itens no momento.',
      };
  }
};

export const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  type,
  title: customTitle,
  description: customDescription,
  action,
  secondaryAction,
}) => {
  const { t } = useLanguage();
  const config = getEmptyStateConfig(type, t);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
        minHeight: 300,
      }}
    >
      {config.icon}
      
      <Typography
        variant="h5"
        component="h2"
        sx={{
          mt: 3,
          mb: 1,
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        {customTitle || config.title}
      </Typography>
      
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mb: 4,
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        {customDescription || config.description}
      </Typography>
      
      {(action || secondaryAction) && (
        <Stack direction="row" spacing={2} justifyContent="center">
          {action && (
            <Button
              variant="contained"
              onClick={action.onClick}
              startIcon={type === 'error' ? <Refresh /> : undefined}
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant="outlined"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';