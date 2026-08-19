import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // `host: true` permite acessar o dev server de dentro de um container.
    host: true,
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 5173,
  },
})
