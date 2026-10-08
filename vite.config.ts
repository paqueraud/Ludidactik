/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH permet de publier l'app dans un sous-dossier (ex. GitHub Pages : /Ludidactik/).
const base = process.env.BASE_PATH ?? '/';

/** Chunks des jeux : exclus du precache, mis en cache à la première ouverture (runtime caching). */
const chunksDeJeux = new Set<string>();

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      // repère les chunks des composants de jeux (import() depuis src/games/<id>/index.ts)
      name: 'ludidactik-chunks-de-jeux',
      generateBundle(_o, bundle) {
        for (const c of Object.values(bundle))
          if (
            c.type === 'chunk' &&
            c.isDynamicEntry &&
            /\/src\/games\/[a-z0-9-]+\//.test(c.facadeModuleId ?? '')
          )
            chunksDeJeux.add(c.fileName);
      },
    },
    VitePWA({
      // « prompt » : le bandeau « Nouvelle version : recharger » (src/app/MiseAJour.tsx) laisse finir la partie
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        id: base,
        name: 'Ludidactik — Révisions ludiques',
        short_name: 'Ludidactik',
        description:
          "Réviser les leçons de l'école en s'amusant (CE1, CM2), conforme aux programmes officiels.",
        lang: 'fr',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        // écran de lancement (Android) : fond crème + icône Ludo
        background_color: '#FFF8EC',
        theme_color: '#4FC3F7',
        categories: ['education', 'kids', 'games'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/ludo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          {
            name: 'Défis du jour',
            short_name: 'Défis',
            url: `${base}defis`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Salle de jeux',
            short_name: 'Jeux',
            url: `${base}jeux`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // App shell + contenu (curriculum, générateurs) en precache ; les jeux (chunksDeJeux)
        // sont mis en cache à leur première ouverture.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,mp3}'],
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.filter((e) => !chunksDeJeux.has(e.url.replace(/^\//, ''))),
            warnings: [],
          }),
        ],
        navigateFallback: `${base}index.html`,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.destination === 'script' && url.pathname.includes('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ludidactik-jeux', expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//,
            },
            { name: 'motion', test: /node_modules\/(framer-motion|motion-dom|motion-utils)\// },
            { name: 'dexie', test: /node_modules\/(dexie|dexie-react-hooks)\// },
            { name: 'zod', test: /node_modules\/zod\// },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  // Les copies de travail des agents (.claude/worktrees) ne doivent pas être surveillées
  server: { port: 5173, watch: { ignored: ['**/.claude/**', '**/maquette_ai_studio/**'] } },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 15_000,
    setupFiles: ['./src/test/setup.ts', './src/app/contenu.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
