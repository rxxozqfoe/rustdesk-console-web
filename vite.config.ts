import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@base-ui/react',
      'lucide-react',
      'react-hook-form',
      '@hookform/resolvers',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'react-router',
      'zod',
      'axios',
      'zustand',
      'i18next',
      'react-i18next',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:21114',
        changeOrigin: true,
      },
    },
  },
})
