
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // บังคับให้ Vite แทนที่ process.env.API_KEY ด้วยค่าจาก Environment Variable ของ Netlify จริงๆ
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
