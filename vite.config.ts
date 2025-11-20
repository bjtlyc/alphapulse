import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Matches your GitHub repository name
  base: '/alphapulse/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // This prevents "process is not defined" crashes in the browser.
    // It initializes process.env as an empty object.
    'process.env': {}
  }
});