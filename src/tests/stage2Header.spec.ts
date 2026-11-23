// @vitest-environment node
/**
 * Etappe 2 (Blau-Gold): Navigation des SSI-Partials und Player-Header über Tokens,
 * eingebunden auf beiden Musikplayer-Seiten.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseBlock } from '../design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const css = read('../assets/styles/kodini-header-stage2.css').replace(/\/\*[\s\S]*?\*\//g, '')
const tokensCss = read('../design-system/tokens-v2.css')
const rootBlock = parseBlock(tokensCss, ':root', 'tokens-v2.css')

describe('Stylesheet Etappe 2', () => {
  it.each(['index', 'app'])('%s.astro bindet es nach Etappe 1 ein', (page) => {
    const src = read(`../pages/ultimativer-musikplayer/${page}.astro`)
    const stage1 = src.indexOf("import '../../assets/styles/kodini-layout-stage1.css'")
    const stage2 = src.indexOf("import '../../assets/styles/kodini-header-stage2.css'")
    expect(stage1).toBeGreaterThan(-1)
    expect(stage2).toBeGreaterThan(stage1)
  })

  it('nutzt weder Farbwerte noch Verlauf noch Outline-Fokus noch feste Pixelgrade', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
    expect(css).not.toMatch(/gradient\(/)
    expect(css).not.toMatch(/outline(?!: none)[a-z-]*:/)
    expect(css).not.toMatch(/font-size: (?!var\()/)
  })

  it('referenziert nur definierte --ds-* Tokens', () => {
    const used = [...new Set([...css.matchAll(/var\((--ds-[a-z0-9-]+)/g)].map((m) => m[1]))]
    expect(used.length).toBeGreaterThan(8)
    expect(used.filter((name) => rootBlock[name as string] === undefined)).toEqual([])
  })

  it('braucht keinen eigenen Light-Block, weil die Tokens das Theme tragen', () => {
    expect(css).not.toMatch(/data-theme|light-theme|\.dark\b/)
  })

  it('zeigt den Fokus der Navigation mit dem Fokus-Ring-Token', () => {
    expect(css).toMatch(
      /\.global-nav :is\(a, button\):focus-visible \{\s*outline: none;\s*box-shadow: var\(--ds-focus-ring\);/
    )
  })
})
