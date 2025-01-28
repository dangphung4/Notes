import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'notes',
      short_name: 'notes',
      description: 'A notetaking app for myself',
      theme_color: '#000000',
      icons: [
        {
          src: '/assets/note.svg',
          sizes: '200x200',
          type: 'image/svg+xml',
        },
        {
          src: '/assets/note512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
        },
        {
          src: '/assets/note192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
        },
        {
          src: '/assets/note180.svg',
          sizes: '180x180',
          type: 'image/svg+xml',
        },
        {
          src: '/assets/note167.svg',
          sizes: '167x167',
          type: 'image/svg+xml',
        },
        {
          src: '/assets/note144.svg',
          sizes: '144x144',
          type: 'image/svg+xml',
        },
        {
          src: '/assets/note32.svg',
          sizes: '32x32',
          type: 'image/svg+xml',
        },

      ],
    },
  
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.svg'],
})