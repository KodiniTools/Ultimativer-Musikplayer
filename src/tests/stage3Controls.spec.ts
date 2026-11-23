// @vitest-environment node
/**
 * Etappe 3 (Blau-Gold): Bedienfelder (Uploader, Equalizer, Visualizer-Regler, Wiedergabe,
 * Tastaturhilfe) nur über Tokens, eingebunden auf der Player-Seite.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseBlock } from '../design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const css = read('../assets/styles/kodini-controls-stage3.css').replace(/\/\*[\s\S]*?\*\//g, '')
const app = read('../pages/ultimativer-musikplayer/app.astro')
const rootBlock = parseBlock(read('../design-system/tokens-v2.css'), ':root', 'tokens-v2.css')

describe('Stylesheet Etappe 3', () => {
  it('wird in app.astro nach Etappe 1 und 2 eingebunden', () => {
    const order = ['layout-stage1', 'header-stage2', 'controls-stage3'].map((name) =>
      app.indexOf(`import '../../assets/styles/kodini-${name}.css'`)
    )
    expect(order[0]).toBeGreaterThan(-1)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('nutzt keine Farbwerte, Verläufe, Outline-Fokusringe oder festen Rahmenbreiten', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
    expect(css).not.toMatch(/gradient\(/)
    expect(css).not.toMatch(/outline(?!: none)[a-z-]*:/)
    expect(css).not.toMatch(/\b1px\b/)
    expect(css).not.toMatch(/(?:^|[;{\s])--[a-z0-9-]+\s*:/)
  })

  it('referenziert nur definierte --ds-* Tokens', () => {
    const used = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))]
    expect(used.length).toBeGreaterThan(8)
    expect(used.filter((name) => rootBlock[name as string] === undefined)).toEqual([])
  })

  it('zeigt den Fokus von Equalizer-Reglern und Wiedergabetasten per Fokus-Ring-Token', () => {
    for (const selector of [
      '.eq .eq__slider',
      '.player-bar .pbar-btn',
      '.player-bar .control-btn-sm',
    ]) {
      expect(css).toContain(`${selector}:focus-visible`)
    }
    const blocks = [...css.matchAll(/:focus-visible\s*\{([^}]*)\}/g)].map((m) => m[1])
    expect(blocks.length).toBe(2)
    for (const body of blocks)
      expect(body).toMatch(/outline: none;\s*box-shadow: var\(--ds-focus-ring\);/)
  })

  it('stellt die zehn Equalizer-Bänder bis 600 px in zwei Reihen', () => {
    expect(css).toMatch(/\.eq__bands \{[^}]*grid-template-columns: repeat\(10, minmax\(0, 1fr\)\)/)
    const mobile = css.match(/@media \(max-width: 600px\) \{([\s\S]*)\}\s*$/)?.[1] ?? ''
    expect(mobile).toMatch(
      /\.eq__bands \{[^}]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/
    )
  })
})
