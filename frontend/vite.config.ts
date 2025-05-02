import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env': process.env
  },
  build: {
    assetsInlineLimit: 0,
    minify: 'esbuild',
    sourcemap: true,
  },
  server: {
    port: process.env.REACT_PORT ? parseInt(process.env.REACT_PORT) : undefined,
    headers: {
      'Content-Security-Policy': "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:"
    }
  },
  preview: {
    port: process.env.REACT_PORT ? parseInt(process.env.REACT_PORT) : undefined,
    headers: {
      'Content-Security-Policy': "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:"
    }
  },
})