import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target:'https://wrxa7sq9l7.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        // Preserve the `/api` prefix so requests to /api/* are forwarded
        // as /api/* to the remote API (avoid 404s caused by path mismatch).
        // No rewrite function configured.
        secure: true,
      },
    },
  },
});
