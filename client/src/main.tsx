import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AppThemeProvider } from './components/ThemeProvider';
import App from './App.tsx';

import './index.css';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </AppThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
