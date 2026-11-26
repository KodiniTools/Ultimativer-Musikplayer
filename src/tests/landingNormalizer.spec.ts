// @vitest-environment node
/**
 * Landingpage nach dem Muster des Audio Normalizers: Struktur, Palette aus tokens-normalizer.css,
 * ausschließlich Supreme Regular (400), kein Werbebild mehr unter den Funktionskarten.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { contrastRatio, parseBlock } from '../design-system/__tests__/tokenTestUtils'
import de from '../components/vue/ultimativer-musikplayer/i18n/locales/de.js'
import en from '../components/vue/ultimativer-musikplayer/i18n/locales/en.js'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const page = read('../pages/ultimativer-musikplayer/index.astro')
const css = read('../assets/styles/kodini-landing.css').replace(/\/\*[\s\S]*?\*\//g, '')
const palette = read('../design-system/tokens-normalizer.css')
const tokensV2 = parseBlock(read('../design-system/tokens-v2.css'), ':root', 'tokens-v2.css')

const DARK = parseBlock(palette, 'html.kodini-player-page--landing', 'tokens-normalizer.css')
const LIGHT = parseBlock(
  palette,
  "html.kodini-player-page--landing[data-theme='light'],\nhtml.kodini-player-page--landing[data-theme='light'] body",
  'tokens-normalizer.css'
)

describe('Landingpage: Aufbau', () => {
  it('setzt die Seitenklasse und bindet Palette und Layout nach main.css ein', () => {
    expect(page).toContain(
      '<html lang="de" class="kodini-player-page kodini-player-page--landing">'
    )
    const order = ['main.css', 'tokens-normalizer.css', 'kodini-landing.css'].map((name) =>
      page.indexOf(`${name}'`)
    )
    expect(order[0]).toBeGreaterThan(-1)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('folgt dem Normalizer: Hero (Text + Bildrahmen), Funktionskarten, FAQ', () => {
    const hero = page.match(/<section class="hero">([\s\S]*?)<\/section>/)?.[1] ?? ''
    for (const cls of [
      'hero-content',
      'hero-title',
      'hero-subtitle',
      'hero-description',
      'btn-hero',
    ]) {
      expect(hero).toContain(`class="${cls}`)
    }
    expect(hero).toMatch(/<figure class="hero-media">\s*<img\s+class="hero-image"/)
    expect(hero).toMatch(/width="1120"\s+height="630"/)
    const order = ['class="hero"', 'id="features"', 'id="faq"'].map((marker) =>
      page.indexOf(marker)
    )
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order.every((index) => index > -1)).toBe(true)
    expect(page.match(/class="feature-card"/g)).toHaveLength(6)
    expect(page.match(/class="faq-item"/g)).toHaveLength(6)
  })

  it('bindet das Hero-Bild in 1120 und 560 px ein, die Dateien existieren', () => {
    for (const size of [560, 1120]) {
      expect(page).toContain(`music-listening-${size}.webp`)
      const file = fileURLToPath(
        new URL(`../assets/images/music-listening-${size}.webp`, import.meta.url)
      )
      expect(existsSync(file)).toBe(true)
    }
  })

  it('zeigt kein Werbebild mehr (Elemente, Dateien, Test)', () => {
    expect(page).not.toMatch(/promo/i)
    for (const lang of ['de', 'en'])
      for (const size of [1000, 2000]) {
        const file = fileURLToPath(
          new URL(`../assets/images/promo-${lang}-${size}.webp`, import.meta.url)
        )
        expect(existsSync(file)).toBe(false)
      }
  })

  it('FAQ: Antworten sind zu, Schalter tragen aria-expanded und blenden per hidden', () => {
    expect(page.match(/aria-expanded="false"/g)).toHaveLength(6)
    expect(page.match(/class="faq-answer" hidden/g)).toHaveLength(6)
    expect(page).toContain("toggleAttribute('hidden', !open)")
  })

  it('pflegt die Unterzeile in beiden Sprachen', () => {
    expect(de.hero.subtitle).toBeTruthy()
    expect(en.hero.subtitle).toBeTruthy()
    expect(page).toContain('data-i18n="hero.subtitle"')
  })
})

describe('Landingpage: Maße wie im Normalizer', () => {
  const rule = (selector: string) =>
    css.match(
      new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`)
    )?.[1] ?? ''

  it('Inhaltsbreite 1160 px und Hero-Raster 0.9fr / 1.1fr, unter 761 px einspaltig', () => {
    expect(palette).toContain('--ds-container-landing: 1160px;')
    expect(rule('.landing-page > section > .container')).toContain(
      'max-width: var(--ds-container-landing)'
    )
    expect(rule('.landing-page .hero > .container')).toContain(
      'grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr)'
    )
    expect(css).toMatch(
      /@media \(max-width: 760px\) \{\s*\.landing-page \.hero > \.container \{[^}]*minmax\(0, 1fr\)/
    )
  })

  it('Titel 36–72 px, Bildrahmen max. 800 px mit Seitenverhältnis 1120/630', () => {
    expect(DARK['--ds-text-display']).toBe('clamp(2.25rem, 5.25vw, 4.5rem)')
    expect(rule('.landing-page .hero-title')).toContain('font-size: var(--ds-text-display)')
    expect(rule('.landing-page .hero-media')).toContain('max-width: 800px')
    expect(rule('.landing-page .hero-image')).toContain('aspect-ratio: 1120 / 630')
  })

  it('Unterzeile in --ds-heading-accent (cyan)', () => {
    expect(rule('.landing-page .hero-subtitle')).toContain('color: var(--ds-heading-accent)')
    expect(DARK['--ds-heading-accent']).toBe('#69d7e9')
    expect(LIGHT['--ds-heading-accent']).toBe('#086a80')
  })

  it('FAQ-Liste 720 px breit', () => {
    expect(rule('.landing-page .faq-list')).toContain('max-width: 720px')
  })

  it('nutzt keine Farbwerte, eigenen Variablen oder Outline-Fokusringe', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|gradient\(/)
    expect(css).not.toMatch(/(?:^|[;{\s])--[a-z0-9-]+\s*:/)
    expect(css).not.toMatch(/outline(?!: none)[a-z-]*:/)
  })

  it('referenziert nur Tokens aus tokens-v2.css oder tokens-normalizer.css', () => {
    const defined = new Set([...Object.keys(tokensV2), ...Object.keys(DARK)])
    const used = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1] as string))]
    expect(used.length).toBeGreaterThan(15)
    expect(used.filter((name) => !defined.has(name))).toEqual([])
  })
})

describe('Landingpage: nur Supreme Regular', () => {
  it('setzt alle Gewichts-Tokens auf 400 und schaltet font-synthesis ab', () => {
    for (const name of ['--ds-weight-medium', '--ds-weight-semibold', '--ds-weight-bold']) {
      expect(DARK[name]).toBe('400')
    }
    expect(css).toMatch(/--ds-weight-regular\)/)
    expect(css).toMatch(/body \{\s*font-synthesis: none;/)
    expect(css).not.toMatch(/font-weight: (?!var\(--ds-weight-)/)
  })
})

describe('Landingpage-Palette (aus dem Audio Normalizer)', () => {
  const KEYS = [
    '--ds-surface-0', '--ds-surface-1', '--ds-surface-2', '--ds-surface-3', '--ds-border',
    '--ds-border-strong', '--ds-text', '--ds-text-2', '--ds-text-3', '--ds-accent',
    '--ds-accent-hover', '--ds-accent-soft', '--ds-on-accent', '--ds-link', '--ds-glow-blue',
    '--ds-glow-cyan', '--ds-heading-accent', '--ds-focus-ring', '--ds-shadow-overlay',
    '--ds-landing-backdrop', '--ds-card-gradient',
  ] // prettier-ignore

  it.each(KEYS)('%s ist in Dark und Light gesetzt', (key) => {
    expect(DARK[key]).toBeTruthy()
    expect(LIGHT[key]).toBeTruthy()
  })

  it('hat die Normalizer-Werte für Flächen, Text und Akzent', () => {
    expect([DARK['--ds-surface-0'], DARK['--ds-text'], DARK['--ds-accent']]).toEqual([
      '#0a1324',
      '#f2eee2',
      '#d4a257',
    ])
    expect([LIGHT['--ds-surface-0'], LIGHT['--ds-text'], LIGHT['--ds-accent']]).toEqual([
      '#f6f5f1',
      '#14213a',
      '#c9984d',
    ])
  })

  it.each([
    ['dark', DARK],
    ['light', LIGHT],
  ])('%s: Text, Unterzeile und Akzent-Button erreichen WCAG AA (4.5:1)', (_theme, block) => {
    const surface = block['--ds-surface-0'] as string
    for (const key of ['--ds-text', '--ds-text-2', '--ds-heading-accent'])
      expect(contrastRatio(block[key] as string, surface)).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(block['--ds-on-accent'] as string, block['--ds-accent'] as string)
    ).toBeGreaterThanOrEqual(4.5)
  })
})

describe('Zweifarbiger Titel', () => {
  const T = [
    ['dark', DARK, '#e6bc76', '#48a0d8'],
    ['light', LIGHT, '#775115', '#0058a0'],
  ] as const

  it.each(T)('%s: Gold und Blau wie vorgegeben, Kontrast ≥ 4.5:1', (_n, block, gold, blue) => {
    expect(block['--ds-title-gold']).toBe(gold)
    expect(block['--ds-title-blue']).toBe(blue)
    for (const c of [gold, blue])
      expect(contrastRatio(c, block['--ds-surface-0'] as string)).toBeGreaterThanOrEqual(4.5)
  })

  it('setzt erstes Wort in Gold, zweites in Blau, per Token und ohne Hex', () => {
    const css = readFileSync(
      new URL('../assets/styles/kodini-landing.css', import.meta.url),
      'utf8'
    )
    expect(css).toMatch(/\.hero-title__accent \{\s*color: var\(--ds-title-gold\);/)
    expect(css).toMatch(/\.hero-title__main \{\s*color: var\(--ds-title-blue\);/)
    const page = readFileSync(
      new URL('../pages/ultimativer-musikplayer/index.astro', import.meta.url),
      'utf8'
    )
    expect(page).toContain('data-i18n="hero.titleAccent"')
    expect(page).toContain('data-i18n="hero.titleMain"')
  })
})
