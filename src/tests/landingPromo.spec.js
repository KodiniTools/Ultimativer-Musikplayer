// @vitest-environment node
// Werbebild der Landingpage: je Sprache ein Bild, verlinkt mit der App-Seite derselben Sprache.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const page = readFileSync(
  new URL('../pages/ultimativer-musikplayer/index.astro', import.meta.url),
  'utf8'
)

describe('Landingpage: Werbebild', () => {
  it('verlinkt DE mit der deutschen und EN mit der englischen App-Seite', () => {
    expect(page).toContain("de: '/ultimativer-musikplayer/app/'")
    expect(page).toContain("en: '/ultimativer-musikplayer/app/?lang=en'")
    expect(page).toMatch(/lang: 'de',\s*href: APP_URL\.de/)
    expect(page).toMatch(/lang: 'en',\s*href: APP_URL\.en/)
  })

  it.each(['de', 'en'])('bindet beide Größen für %s ein und die Dateien existieren', (lang) => {
    for (const size of [1000, 2000]) {
      const rel = `../../assets/images/promo-${lang}-${size}.webp`
      expect(page).toContain(`from '${rel}'`)
      const file = fileURLToPath(
        new URL(`../assets/images/promo-${lang}-${size}.webp`, import.meta.url)
      )
      expect(existsSync(file)).toBe(true)
    }
  })

  it('zeigt nur die Fassung zur Sprache von <html lang>', () => {
    expect(page).toMatch(
      /html\[lang='en'\] \.promo--de,\s*html:not\(\[lang='en'\]\) \.promo--en \{\s*display: none;/
    )
  })

  it('setzt Alternativtext, feste Maße und Lazy Loading', () => {
    expect(page).toMatch(/alt=\{promo\.alt\}/)
    expect(page).toMatch(/width=\{promo\.large\.width\}/)
    expect(page).toMatch(/height=\{promo\.large\.height\}/)
    expect(page).toContain('loading="lazy"')
  })
})
