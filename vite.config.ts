import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use '/Lagan/' only when building for production (GitHub Pages)
  // Use '/' (root) when running locally (npm run dev)
  base: command === 'build' ? '/Lagan/' : '/',
}));