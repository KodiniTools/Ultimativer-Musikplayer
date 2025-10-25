import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // WICHTIG: base muss auf den Pfad der Subdomain gesetzt werden
  base: '/ultimativermusikplayer/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generiere relative Pfade für bessere Kompatibilität
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
