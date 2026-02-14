import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'

export default defineConfig({
  site: 'https://kodinitools.com',
  base: '/ultimativer-musikplayer',
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app'
    })
  ],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})
