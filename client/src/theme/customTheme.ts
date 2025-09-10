import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
      success: string;
      error: string;
      info: string;
    };
  }
  interface PaletteOptions {
    gradient?: {
      primary?: string;
      secondary?: string;
      success?: string;
      error?: string;
      info?: string;
    };
  }
}

const customTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a5f', // Azul profissional escuro
      light: '#4a6fa5',
      dark: '#0d1929',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6b35', // Laranja vibrante
      light: '#ff9a65',
      dark: '#c43e00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#00c896',
      light: '#5ce1b3',
      dark: '#00936b',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff3366',
      light: '#ff6b8a',
      dark: '#d91e48',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffb84d',
      light: '#ffd180',
      dark: '#f9a825',
      contrastText: '#1e3a5f',
    },
    info: {
      main: '#00bcd4',
      light: '#62d4e3',
      dark: '#008ba3',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #00c896 0%, #00d4aa 100%)',
      error: 'linear-gradient(135deg, #ff3366 0%, #ff6b8a 100%)',
      info: 'linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.05)',
    '0px 8px 16px rgba(0,0,0,0.05)',
    '0px 12px 24px rgba(0,0,0,0.05)',
    '0px 16px 32px rgba(0,0,0,0.05)',
    '0px 20px 40px rgba(0,0,0,0.06)',
    '0px 24px 48px rgba(0,0,0,0.07)',
    '0px 28px 56px rgba(0,0,0,0.08)',
    '0px 32px 64px rgba(0,0,0,0.09)',
    '0px 36px 72px rgba(0,0,0,0.10)',
    '0px 40px 80px rgba(0,0,0,0.11)',
    '0px 44px 88px rgba(0,0,0,0.12)',
    '0px 48px 96px rgba(0,0,0,0.13)',
    '0px 52px 104px rgba(0,0,0,0.14)',
    '0px 56px 112px rgba(0,0,0,0.15)',
    '0px 60px 120px rgba(0,0,0,0.16)',
    '0px 64px 128px rgba(0,0,0,0.17)',
    '0px 68px 136px rgba(0,0,0,0.18)',
    '0px 72px 144px rgba(0,0,0,0.19)',
    '0px 76px 152px rgba(0,0,0,0.20)',
    '0px 80px 160px rgba(0,0,0,0.21)',
    '0px 84px 168px rgba(0,0,0,0.22)',
    '0px 88px 176px rgba(0,0,0,0.23)',
    '0px 92px 184px rgba(0,0,0,0.24)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, var(--color-main) 0%, var(--color-dark) 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, var(--color-dark) 0%, var(--color-main) 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        filled: {
          background: 'linear-gradient(135deg, var(--color-light) 0%, var(--color-main) 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          backdropFilter: 'blur(20px)',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a7c 100%)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.2)',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '16px 0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        },
        head: {
          fontWeight: 700,
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

export default customTheme;