import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://brsvcub050:3079/rest',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          vendor: ['react', 'react-dom'],

          // MUI (split into smaller chunks)
          'mui-core': ['@mui/material'],
          'mui-icons': ['@mui/icons-material'],
          'mui-emotion': ['@emotion/react', '@emotion/styled'],

          // Routing
          router: ['react-router-dom'],

          // Forms and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Data fetching
          query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],

          // Heavy libraries (lazy loaded)
          'pdf-lib': ['jspdf', 'jspdf-autotable', 'pdf-lib'],
          'excel-lib': ['xlsx'],

          // Animation
          animation: ['framer-motion'],

          // Utils
          utils: ['axios', 'date-fns', 'zustand', 'clsx', 'tailwind-merge'],

          // Notifications
          toast: ['react-toastify'],
        },
        // Optimize asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
    ],
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Enable tree-shaking and optimizations
    treeShaking: true,
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
