import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['node_modules/**', 'dist/**'],
  },
  root: '.',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'index.html'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
});
