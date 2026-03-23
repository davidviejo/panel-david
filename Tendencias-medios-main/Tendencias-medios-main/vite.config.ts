import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const distDir = path.resolve(__dirname, '../../backend/p2/static/trends_media');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: '/trends/media/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      outDir: distDir,
      emptyOutDir: true,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
