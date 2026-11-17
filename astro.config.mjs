import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import { readFile, writeFile } from 'node:fs/promises'
import { EN_PAGES } from './src/config/pageMeta.js'
import { localizeHtml } from './src/utils/localizeHtml.js'

/**
 * Schreibt nach dem Build neben jede Seite aus EN_PAGES (Landingpage und App-Seite) eine
 * englische Fassung index.en.html mit englischem <html lang>, Titel, Description,
 * Canonical (?lang=en) und og:*. nginx liefert sie für /ultimativer-musikplayer/?lang=en
 * und /ultimativer-musikplayer/app/?lang=en aus, damit Crawler ohne JavaScript schon im
 * HTML Englisch sehen. Laufzeit-i18n bleibt unverändert.
 */
function localizedLanding() {
  return {
    name: 'localized-landing',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        for (const { source, file, meta } of EN_PAGES) {
          const html = await readFile(new URL(source, dir), 'utf8')
          await writeFile(
            new URL(file, dir),
            localizeHtml(html, { lang: 'en', ...meta.en, canonical: `${meta.url}?lang=en` })
          )
        }
      },
    },
  }
}

export default defineConfig({
  site: 'https://kodinitools.com',
  base: '/ultimativer-musikplayer',
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app',
    }),
    localizedLanding(),
  ],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
})
