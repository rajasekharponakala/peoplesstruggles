import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// GitHub Pages serves the site from /<repo>/. Override with BASE_PATH if needed
// (e.g. BASE_PATH=/ for a custom domain or local preview at the root).
const base = process.env.BASE_PATH ?? '/peoplesstruggles/'

// SPA fallback for GitHub Pages: unknown paths serve 404.html, which is the app.
const spaFallback = () => ({
  name: 'spa-404-fallback',
  closeBundle() {
    const out = resolve(__dirname, 'dist')
    copyFileSync(resolve(out, 'index.html'), resolve(out, '404.html'))
  },
})

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('leaflet')) return 'leaflet'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
