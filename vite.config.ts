/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const src = path.resolve(__dirname, './src')

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@/lib', replacement: path.join(src, 'lib') },
      { find: '@/components', replacement: path.join(src, 'components') },
      { find: '@/types', replacement: path.join(src, 'types') },
      { find: '@/hooks', replacement: path.join(src, 'hooks') },
      { find: '@', replacement: src },
    ],
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
