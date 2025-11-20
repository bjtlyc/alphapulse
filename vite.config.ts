import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'alphapulse' with your actual GitHub repository name
  // If your repo is https://github.com/username/my-stock-app, change this to '/my-stock-app/'
  base: './', 
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // This ensures process.env works in the browser for the API key
    'process.env': process.env
  }
});