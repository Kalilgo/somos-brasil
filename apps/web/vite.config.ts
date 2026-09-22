import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

function appVersion(): Plugin {
  return {
    name: 'app-version',
    apply: 'build',
    transformIndexHtml(html) {
      const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA
      const version = sha
        ? sha.slice(0, 8)
        : new Date().toISOString().replace(/\D/g, '').slice(0, 14)
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { name: 'app-version', content: version },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    appVersion(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png', 'favicon.ico'],
      manifest: {
        name: 'Somos Brasil',
        short_name: 'Somos Brasil',
        description:
          'Planifiquemos el viaje entre todos: ideas, votos, itinerario y resumen de gastos.',
        lang: 'es',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#ff5a5f',
        background_color: '#fff8ef',
        categories: ['travel', 'social', 'planning'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/auth\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})