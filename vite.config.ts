import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.1.39', // Ou o IP correto da sua máquina
    port: 3000,
    hmr: {
      host: '192.168.1.39', // Adicione esta linha se estiver acessando de outro IP
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});