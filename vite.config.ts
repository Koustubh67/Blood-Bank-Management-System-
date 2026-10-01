import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * e-RaktKosh sends its CORS header twice ("*, *"), which browsers reject, so
 * the camp schedule is fetched through a same-origin proxy. The same path is
 * rewritten in vercel.json and public/_redirects for production.
 */
const proxy: Record<string, ProxyOptions> = {
  '/api/eraktkosh': {
    target: 'https://eraktkosh.mohfw.gov.in',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/eraktkosh/, '/eraktkoshPortal'),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { proxy },
  preview: { proxy },
})
