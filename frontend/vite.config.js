import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Listen on all network interfaces untuk akses dari perangkat lain
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'react-query': ['react-query'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'charts': ['recharts'],
          'forms': ['react-hook-form'],
          'maps': ['leaflet', 'react-leaflet'],
          'socket': ['socket.io-client'],
          // App chunks
          'notifications': [
            './src/pages/notifications/NotificationTemplatesPage.jsx',
            './src/pages/notifications/NotificationAnalyticsPage.jsx',
            './src/pages/notifications/NotificationSettingsPage.jsx',
          ],
          'customers': [
            './src/pages/customers/CustomersPage.jsx',
            './src/pages/customers/CustomerDetailPage.jsx',
          ],
          'tickets': [
            './src/pages/tickets/TicketsPage.jsx',
            './src/pages/tickets/TicketDetailPage.jsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'es2015',
  },
})
