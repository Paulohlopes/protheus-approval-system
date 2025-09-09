import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#546e7a',
        light: '#819ca9',
        dark: '#29434e',
      },
      secondary: {
        main: '#78909c',
      },
      grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
      },
      success: {
        main: '#66bb6a',
        light: '#98ee99',
        dark: '#357a38',
      },
      warning: {
        main: '#ffa726',
        light: '#ffcc80',
        dark: '#f57c00',
      },
      error: {
        main: '#ef5350',
        light: '#ff7961',
        dark: '#c62828',
      },
    },
  });

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
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </MuiThemeProvider>
  );
};