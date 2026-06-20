import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/connect4/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Connect Four — Drop & Win',
        short_name: 'Connect4',
        description: 'Remote multiplayer Connect Four. Create a room, share your code, play.',
        theme_color: '#0D1117',
        background_color: '#0D1117',
        display: 'standalone',
        scope: '/connect4/',
        start_url: '/connect4/',
        orientation: 'portrait-primary',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: []
      },
      devOptions: { enabled: false }
    })
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  }
})
