import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { useAppTheme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, isDarkMode } = useAppTheme();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
        style={{ zIndex: 9999 }}
      />
    </MuiThemeProvider>
  );
};