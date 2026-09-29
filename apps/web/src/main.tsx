import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--color-elevated)',
            color: 'var(--color-text-primary)',
            borderRadius: '12px',
            fontSize: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#34C759', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#FF3B30', secondary: '#fff' },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
