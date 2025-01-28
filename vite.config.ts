import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        sourcemap: true,
      },
      manifest: {
        name: 'Notes ig',
        short_name: 'Notes',
        description: 'A minimalist note-taking app with cloud sync',
        theme_color: '#000000',
        icons: [
          {
            src: 'assets/note-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'assets/note-rounded.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
}); 