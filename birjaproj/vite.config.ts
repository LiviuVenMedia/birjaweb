import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['birja.travinskiy.shop'],
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      host: 'birja.travinskiy.shop',
      protocol: 'wss',
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'https://birjaback.travinskiy.shop',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  base: '/',
})
