/// <reference types="vitest/config" />
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// `base` tiene que coincidir con el nombre del repositorio en GitHub Pages.
const BASE = '/Dieta/'

export default defineConfig({
  base: BASE,
  plugins: [
    preact(),
    // App instalable y que abre sin internet: guarda en el teléfono todo lo que hace falta para funcionar.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dieta',
        short_name: 'Dieta',
        description: 'Qué comer en cada momento del día, con los carbohidratos ya contados.',
        lang: 'es-AR',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f7f3',
        theme_color: '#3b7a5a',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Cualquier ruta de la app (/otra, /piezas, /ajustes) abre la página principal, también sin internet.
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // La fuente Atkinson Hyperlegible: se guarda la primera vez y después no se vuelve a pedir.
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fuentes',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/pruebas/**/*.test.ts'],
  },
})
