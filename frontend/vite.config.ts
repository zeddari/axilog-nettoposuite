import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api':    { target: env.VITE_API_URL ?? 'http://localhost:3001', changeOrigin: true },
        '/socket.io': { target: env.VITE_WS_URL ?? 'http://localhost:3001', ws: true, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'reactflow':    ['reactflow'],
            'charts':       ['recharts'],
          },
        },
      },
    },
  };
});
