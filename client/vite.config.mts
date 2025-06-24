import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000';
  
  // Importar plugins condicionalmente
  const plugins = [
    react(),
    runtimeErrorOverlay()
  ];

  // Cartographer só em ambiente de desenvolvimento e se disponível
  if (mode !== "production" && env.REPL_ID !== undefined) {
    try {
      const cartographer = require("@replit/vite-plugin-cartographer");
      plugins.push(cartographer.cartographer());
    } catch {}
  }
  
  return {
    plugins,
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env': {}
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
        "@server": path.resolve(__dirname, "server"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'utils': ['axios', 'date-fns', 'zod'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      },
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000
      }
    }
  };
}); 