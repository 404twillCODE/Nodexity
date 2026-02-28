import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    open: false, // Electron opens the window; don't open browser
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.{mjs,js}'],
  },
});
