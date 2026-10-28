/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Adresse de publication : https://eloane-ard.github.io/mon-coach/
// L'appli vit donc dans le sous-dossier « /mon-coach/ » du site GitHub Pages.
const BASE = '/mon-coach/'

export default defineConfig({
  base: BASE,
  define: {
    // Date de construction, affichée dans Paramètres pour savoir quelle version est installée.
    __DATE_VERSION__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // « prompt » : une nouvelle version n'est jamais installée en pleine saisie.
      // Un bandeau propose « Mettre à jour » et c'est moi qui décide quand.
      registerType: 'prompt',
      includeAssets: ['icones/icone.svg', 'icones/apple-touch-icon.png'],
      manifest: {
        name: 'Mon Coach — sport et nutrition',
        short_name: 'Mon Coach',
        description: 'Mon suivi personnel sport et nutrition, utilisable hors connexion.',
        lang: 'fr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f4f6f5',
        theme_color: '#14614f',
        icons: [
          { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tous les fichiers de l'appli sont gardés sur le téléphone pour fonctionner hors connexion.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/preparation.ts'],
  },
})
