import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Assignment,
  Search,
  Refresh,
  ShoppingCart,
  ErrorOutline,
  CheckCircle,
  Folder,
  FilterAltOff,
  AssignmentTurnedIn,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface EmptyStateProps {
  type: 'no-documents' | 'no-results' | 'no-purchase-requests' | 'error' | 'success' | 'empty-folder' | 'no-filters';
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
        icon: <AssignmentTurnedIn sx={{ fontSize: 80, color: 'success.main', opacity: 0.6 }} />,
        title: t?.emptyState?.noDocumentsTitle || 'Nenhum documento pendente',
        description: t?.emptyState?.noDocumentsDesc || 'Parabéns! Você não tem documentos aguardando aprovação no momento.',
      };

    case 'no-results':
      return {
        icon: <Search sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />,
        title: t?.emptyState?.noResultsTitle || 'Nenhum resultado encontrado',
        description: t?.emptyState?.noResultsDesc || 'Não encontramos documentos que correspondam aos seus critérios de busca. Tente ajustar os filtros ou termos de busca.',
      };

    case 'no-filters':
      return {
        icon: <FilterAltOff sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />,
        title: t?.emptyState?.noFiltersTitle || 'Nenhum documento com esses filtros',
        description: t?.emptyState?.noFiltersDesc || 'Não há documentos que correspondam aos filtros selecionados. Tente remover alguns filtros.',
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
  const theme = useTheme();
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
        animation: 'fadeInUp 0.5s ease-out',
        '@keyframes fadeInUp': {
          from: {
            opacity: 0,
            transform: 'translateY(30px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <Box
        sx={{
          animation: 'iconBounce 0.6s ease-out',
          '@keyframes iconBounce': {
            '0%': {
              opacity: 0,
              transform: 'scale(0.3) translateY(-20px)',
            },
            '50%': {
              transform: 'scale(1.05)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1) translateY(0)',
            },
          },
        }}
      >
        {config.icon}
      </Box>
      
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