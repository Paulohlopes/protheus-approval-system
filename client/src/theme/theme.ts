import { createTheme, ThemeOptions, PaletteMode } from '@mui/material/styles';

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light' 
      ? {
          // Light mode palette
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#fff',
          },
          secondary: {
            main: '#dc004e',
            light: '#ff5983',
            dark: '#9a0036',
            contrastText: '#fff',
          },
          success: {
            main: '#2e7d32',
            light: '#4caf50',
            dark: '#1b5e20',
            contrastText: '#fff',
          },
          warning: {
            main: '#ed6c02',
            light: '#ff9800',
            dark: '#e65100',
            contrastText: '#fff',
          },
          error: {
            main: '#d32f2f',
            light: '#ef5350',
            dark: '#c62828',
            contrastText: '#fff',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
          text: {
            primary: '#111827',
            secondary: '#6b7280',
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
            contrastText: '#fff',
          },
          secondary: {
            main: '#ec4899',
            light: '#f472b6',
            dark: '#db2777',
            contrastText: '#fff',
          },
          success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
            contrastText: '#000',
          },
          warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            contrastText: '#000',
          },
          error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
            contrastText: '#fff',
          },
          background: {
            default: '#0f1419',
            paper: '#1f2937',
          },
          text: {
            primary: '#f9fafb',
            secondary: '#d1d5db',
          },
        }
    ),
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.125rem',
      fontWeight: 600,
      lineHeight: 1.235,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.167,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.235,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.334,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08333em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: mode === 'light' 
            ? '0 2px 4px 0 rgba(0,0,0,0.1)'
            : '0 2px 4px 0 rgba(0,0,0,0.3)',
          '&:hover': {
            boxShadow: mode === 'light' 
              ? '0 4px 8px 0 rgba(0,0,0,0.15)'
              : '0 4px 8px 0 rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light' 
            ? '0 2px 8px 0 rgba(0,0,0,0.08)'
            : '0 2px 8px 0 rgba(0,0,0,0.25)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: mode === 'light' 
            ? '0 2px 4px 0 rgba(0,0,0,0.06)'
            : '0 2px 4px 0 rgba(0,0,0,0.2)',
        },
        elevation2: {
          boxShadow: mode === 'light' 
            ? '0 4px 8px 0 rgba(0,0,0,0.08)'
            : '0 4px 8px 0 rgba(0,0,0,0.25)',
        },
        elevation3: {
          boxShadow: mode === 'light' 
            ? '0 8px 16px 0 rgba(0,0,0,0.1)'
            : '0 8px 16px 0 rgba(0,0,0,0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' 
            ? '0 2px 4px 0 rgba(0,0,0,0.1)'
            : '0 2px 4px 0 rgba(0,0,0,0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: mode === 'light' 
            ? '1px solid rgba(0, 0, 0, 0.12)'
            : '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) => {
  return createTheme(getDesignTokens(mode));
};

// Default light theme for backwards compatibility
export const theme = createAppTheme('light');