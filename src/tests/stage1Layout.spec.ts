// @vitest-environment node
/**
 * Etappe 1 (Blau-Gold): separates Layout-Stylesheet, Kopfhörer-Motiv im Einstieg der
 * Landingpage, Werbebilder unter den Funktionskarten.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseBlock } from '../design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const landing = read('../pages/ultimativer-musikplayer/index.astro')
const app = read('../pages/ultimativer-musikplayer/app.astro')
const layoutCss = read('../assets/styles/kodini-layout-stage1.css').replace(/\/\*[\s\S]*?\*\//g, '')
const tokensCss = read('../design-system/tokens-v2.css')
const rootBlock = parseBlock(tokensCss, ':root', 'tokens-v2.css')

describe('Stylesheet Etappe 1', () => {
  it.each([
    ['Landingpage', landing, 'landing'],
    ['Player', app, 'app'],
  ])('%s bindet es nach main.css ein und setzt die Seitenklasse', (_name, page, variant) => {
    const main = page.indexOf("import '../../assets/styles/main.css'")
    const stage1 = page.indexOf("import '../../assets/styles/kodini-layout-stage1.css'")
    expect(main).toBeGreaterThan(-1)
    expect(stage1).toBeGreaterThan(main)
    expect(page).toContain(
      `<html lang="de" class="kodini-player-page kodini-player-page--${variant}">`
    )
  })

  it('referenziert nur in tokens-v2.css definierte Variablen', () => {
    const used = [...new Set([...layoutCss.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))]
    expect(used.length).toBeGreaterThan(5)
    expect(used.filter((name) => rootBlock[name as string] === undefined)).toEqual([])
  })

  it('überschreibt keine Tokens und deklariert keine eigenen Variablen', () => {
    expect(layoutCss).not.toMatch(/--[a-z0-9-]+\s*:/)
  })

  it('setzt den Seitenverlauf nur über --ds-page-backdrop', () => {
    expect(layoutCss).toMatch(/background-image: var\(--ds-page-backdrop\);/)
    expect(layoutCss).not.toMatch(/gradient\(/)
  })

  it('richtet den Einstiegstitel wie den Text aus (main.css zentriert h1)', () => {
    expect(layoutCss).toMatch(/\.hero--intro h1 \{[^}]*text-align: inherit;/)
  })

  it('stellt Text und Motiv ab 901 px nebeneinander (Selektor schlägt die Grundregel)', () => {
    const media = layoutCss.match(/@media \(min-width: 901px\) \{\s*([^{]+)\{/)
    expect(media?.[1]?.trim()).toBe('html.kodini-player-page .landing .hero--intro')
  })
})

describe('Tokens Blau-Gold', () => {
  it('nutzt den einzigen Verlauf in --ds-page-backdrop, in Dark und beiden Light-Blöcken', () => {
    const blocks = [':root', '.light-theme', ":root[data-theme='light']"].map((selector) =>
      parseBlock(tokensCss, selector, 'tokens-v2.css')
    )
    for (const block of blocks) {
      expect(block['--ds-page-backdrop']).toContain('var(--ds-page-glow)')
      expect(block['--ds-page-glow']).toMatch(/^#[0-9a-f]{6}$/)
      const withGradient = Object.entries(block).filter(([, value]) => /gradient\(/.test(value))
      expect(withGradient.map(([name]) => name)).toEqual(['--ds-page-backdrop'])
    }
  })
})

describe('Landingpage: Einstieg mit Kopfhörer-Motiv', () => {
  it.each([640, 1200])('bindet music-listening-%i.webp ein und die Datei existiert', (size) => {
    expect(landing).toContain(`from '../../assets/images/music-listening-${size}.webp'`)
    const file = fileURLToPath(
      new URL(`../assets/images/music-listening-${size}.webp`, import.meta.url)
    )
    expect(existsSync(file)).toBe(true)
  })

  it('zeigt Text und Motiv im Hero, Motiv dekorativ mit festen Maßen', () => {
    const hero = landing.match(/<section class="hero hero--intro">([\s\S]*?)<\/section>/)?.[1]
    expect(hero).toBeDefined()
    expect(hero).toContain('<div class="hero__copy">')
    expect(hero).toContain('data-i18n="hero.title"')
    expect(hero).toContain('data-i18n="hero.cta"')
    expect(hero).toMatch(/<img\s+class="hero__image"[\s\S]*?alt=""[\s\S]*?\/>/)
    expect(hero).toMatch(/width=\{heroLarge\.width\}/)
    expect(hero).toMatch(/height=\{heroLarge\.height\}/)
  })

  it('zeigt die Werbebilder nach den Funktionskarten und vor den FAQ', () => {
    const features = landing.indexOf('class="features-grid"')
    const promo = landing.indexOf('promos.map(')
    const faq = landing.indexOf('data-i18n="faq.title"')
    const hero = landing.indexOf('class="hero hero--intro"')
    expect(hero).toBeGreaterThan(-1)
    expect(features).toBeGreaterThan(hero)
    expect(promo).toBeGreaterThan(features)
    expect(faq).toBeGreaterThan(promo)
  })
})
