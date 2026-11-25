// @vitest-environment node
/**
 * Etappe 1 (Blau-Gold, Player): separates Layout-Stylesheet und Seitenverlauf. Die Landingpage
 * steht in landingNormalizer.spec.ts.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseBlock } from '../design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const app = read('../pages/ultimativer-musikplayer/app.astro')
const layoutCss = read('../assets/styles/kodini-layout-stage1.css').replace(/\/\*[\s\S]*?\*\//g, '')
const tokensCss = read('../design-system/tokens-v2.css')
const rootBlock = parseBlock(tokensCss, ':root', 'tokens-v2.css')

describe('Stylesheet Etappe 1 (Player)', () => {
  it('bindet es in app.astro nach main.css ein und setzt die Seitenklasse', () => {
    const main = app.indexOf("import '../../assets/styles/main.css'")
    const stage1 = app.indexOf("import '../../assets/styles/kodini-layout-stage1.css'")
    expect(main).toBeGreaterThan(-1)
    expect(stage1).toBeGreaterThan(main)
    expect(app).toContain('<html lang="de" class="kodini-player-page kodini-player-page--app">')
  })

  it('referenziert nur in tokens-v2.css definierte Variablen', () => {
    const used = [...new Set([...layoutCss.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))]
    expect(used.length).toBeGreaterThan(3)
    expect(used.filter((name) => rootBlock[name as string] === undefined)).toEqual([])
  })

  it('überschreibt keine Tokens und deklariert keine eigenen Variablen', () => {
    expect(layoutCss).not.toMatch(/(?:^|[;{\s])--[a-z0-9-]+\s*:/)
  })

  it('setzt den Seitenverlauf nur über --ds-page-backdrop und nur im Player', () => {
    expect(layoutCss).toMatch(
      /\.kodini-player-page--app body \{\s*background-image: var\(--ds-page-backdrop\);/
    )
    expect(layoutCss).not.toMatch(/gradient\(/)
  })

  it('enthält keine Landingpage-Regeln mehr (die stehen in kodini-landing.css)', () => {
    expect(layoutCss).not.toMatch(/\.landing|\.hero/)
  })
})

describe('Tokens Blau-Gold', () => {
  it('nutzt Verläufe nur in --ds-page-backdrop und den Button-Verläufen, in Dark und beiden Light-Blöcken', () => {
    const blocks = [':root', '.light-theme', ":root[data-theme='light']"].map((selector) =>
      parseBlock(tokensCss, selector, 'tokens-v2.css')
    )
    for (const block of blocks) {
      expect(block['--ds-page-backdrop']).toContain('var(--ds-page-glow)')
      expect(block['--ds-page-glow']).toMatch(/^#[0-9a-f]{6}$/)
      const withGradient = Object.entries(block).filter(([, value]) => /gradient\(/.test(value))
      expect(withGradient.map(([name]) => name).sort()).toEqual([
        '--ds-accent-fill-grad',
        '--ds-accent-fill-grad-hover',
        '--ds-page-backdrop',
      ])
    }
  })
})
