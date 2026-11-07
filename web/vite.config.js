
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
  // Vercel 배포 시에는 보통 '/'를 사용합니다.
  base: '/23-5-team9-web/',
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'https://dev.server.team9-toy-project.p-e.kr',
        changeOrigin: true,
      },
    },
  },
})
