import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import { readFile, writeFile } from 'node:fs/promises'
import { pageMeta } from './src/config/pageMeta.js'
import { localizeHtml } from './src/utils/localizeHtml.js'

/**
 * Schreibt nach dem Build neben die Landingpage (index.html) eine englische Fassung
 * index.en.html mit englischem <html lang>, Titel, Description, Canonical (?lang=en)
 * und og:*. nginx liefert sie für /ultimativer-musikplayer/?lang=en aus, damit Crawler
 * ohne JavaScript schon im HTML Englisch sehen. Laufzeit-i18n bleibt unverändert.
 */
function localizedLanding() {
  return {
    name: 'localized-landing',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const source = new URL('ultimativer-musikplayer/index.html', dir)
        const html = await readFile(source, 'utf8')
        await writeFile(
          new URL('ultimativer-musikplayer/index.en.html', dir),
          localizeHtml(html, { lang: 'en', ...pageMeta.en, canonical: `${pageMeta.url}?lang=en` })
        )
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
