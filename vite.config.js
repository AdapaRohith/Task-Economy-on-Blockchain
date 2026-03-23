import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages deploys to: https://adaparohith.github.io/Task-Economy-on-Blockchain/
  // The base must match the repo name so all asset URLs resolve correctly.
  base: '/Task-Economy-on-Blockchain/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
})
