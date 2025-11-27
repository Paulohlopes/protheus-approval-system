import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import {
  Close,
  Error,
  Warning,
  NetworkCheck,
  Lock,
  Storage,
  HelpOutline,
} from '@mui/icons-material';
import CountryFlag from './CountryFlag';
import { useLanguage } from '../contexts/LanguageContext';
import type { ApiError } from '../types/auth';

interface ApiErrorAlertProps {
  errors?: ApiError[];
  successfulCountries?: string[];
  onClose?: () => void;
}

const ApiErrorAlert: React.FC<ApiErrorAlertProps> = ({
  errors,
  successfulCountries,
  onClose,
}) => {
  const [open, setOpen] = React.useState(true);
  const { t, formatMessage } = useLanguage();

  if (!errors || errors.length === 0) {
    return null;
  }

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const getErrorIcon = (type: ApiError['type']) => {
    switch (type) {
      case 'network':
        return <NetworkCheck />;
      case 'auth':
        return <Lock />;
      case 'server':
        return <Storage />;
      default:
        return <HelpOutline />;
    }
  };

  const getErrorColor = (type: ApiError['type']): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'auth':
        return 'error';
      case 'server':
        return 'error';
      case 'network':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getSeverity = (): 'error' | 'warning' | 'info' => {
    // Se houver erros de autenticação, é crítico
    if (errors.some(e => e.type === 'auth')) {
      return 'error';
    }
    // Se houver erros de servidor, é erro
    if (errors.some(e => e.type === 'server')) {
      return 'error';
    }
    // Se houver apenas erros de rede, é warning
    return 'warning';
  };

  const getTitle = () => {
    const errorCount = errors.length;
    const severity = getSeverity();

    const countryWord = errorCount === 1 ? t.apiErrors.country : t.apiErrors.countries;

    if (severity === 'error') {
      return formatMessage(t.apiErrors.errorConnectingCountries, {
        count: errorCount,
        countryWord: countryWord
      });
    }

    const verbPhrase = errorCount === 1 ? t.apiErrors.isNot : t.apiErrors.areNot;
    const plural = errorCount === 1 ? '' : 'is';

    return formatMessage(t.apiErrors.warningCountriesUnavailable, {
      count: errorCount,
      countryWord: countryWord,
      verbPhrase: verbPhrase,
      plural: plural
    });
  };

  return (
    <Collapse in={open} timeout={300}>
      <Alert
        severity={getSeverity()}
        variant="filled"
        onClose={handleClose}
        sx={{
          mb: 2,
          animation: 'slideInDown 0.4s ease-out',
          '@keyframes slideInDown': {
            from: {
              opacity: 0,
              transform: 'translateY(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {getTitle()}
        </AlertTitle>

        <Box sx={{ mt: 1 }}>
          <Box component="div" sx={{ mb: 2, opacity: 0.95, typography: 'body2' }}>
            {successfulCountries && successfulCountries.length > 0 ? (
              <>
                {t.apiErrors.documentsDisplayedFrom} {' '}
                <Stack direction="row" spacing={0.5} sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                  {successfulCountries.map((country) => (
                    <Chip
                      key={country}
                      icon={<CountryFlag country={country} size={16} />}
                      label={country}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 600,
                        height: 20,
                        '& .MuiChip-icon': {
                          color: 'white',
                        },
                      }}
                    />
                  ))}
                </Stack>
              </>
            ) : (
              t.apiErrors.noCountryAvailable
            )}
          </Box>

          <List dense sx={{ bgcolor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1, py: 0.5 }}>
            {errors.map((error, index) => (
              <ListItem
                key={index}
                sx={{
                  py: 0.5,
                  '&:not(:last-child)': {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {getErrorIcon(error.type)}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CountryFlag country={error.country} size={20} />
                      <Typography variant="body2" fontWeight={600}>
                        {error.country}
                      </Typography>
                      {error.status && (
                        <Chip
                          label={`HTTP ${error.status}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            height: 20,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {error.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.85 }}>
            <strong>{t.apiErrors.tip}</strong> {t.apiErrors.documentsDisplayingNormally}
            {errors.some(e => e.type === 'auth') && ` ${t.apiErrors.checkCredentials}`}
            {errors.some(e => e.type === 'network') && ` ${t.apiErrors.checkNetworkConnection}`}
            {errors.some(e => e.type === 'server') && ` ${t.apiErrors.contactSupport}`}
          </Typography>
        </Box>
      </Alert>
    </Collapse>
  );
};

export default ApiErrorAlert;
