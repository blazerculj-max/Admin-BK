import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2021',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3131'
    }
  }
})
