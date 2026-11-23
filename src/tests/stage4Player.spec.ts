// @vitest-environment node
/**
 * Etappe 4 (Blau-Gold): Visualizer-Rahmen mit Einstellungen darunter, goldene Markierung des
 * aktuellen Titels, gestapelte Player-Leiste bis 480 px – nur über Tokens.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseBlock } from '../design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const css = read('../assets/styles/kodini-player-stage4.css').replace(/\/\*[\s\S]*?\*\//g, '')
const app = read('../pages/ultimativer-musikplayer/app.astro')
const rootBlock = parseBlock(read('../design-system/tokens-v2.css'), ':root', 'tokens-v2.css')

describe('Stylesheet Etappe 4', () => {
  it('wird in app.astro nach Etappe 3 eingebunden', () => {
    const order = ['controls-stage3', 'player-stage4'].map((name) =>
      app.indexOf(`import '../../assets/styles/kodini-${name}.css'`)
    )
    expect(order[0]).toBeGreaterThan(-1)
    expect(order[1]).toBeGreaterThan(order[0] as number)
  })

  it('nutzt keine Farbwerte, Verläufe, Outlines, festen Pixelmaße oder eigenen Variablen', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
    expect(css).not.toMatch(/gradient\(/)
    expect(css).not.toMatch(/outline/)
    expect(css.replace(/@media \([^)]*\)/g, '')).not.toMatch(/\b[1-9]\d*px\b/)
    expect(css).not.toMatch(/(?:^|[;{\s])--[a-z0-9-]+\s*:/)
  })

  it('referenziert nur definierte --ds-* Tokens (keine Altvariablen wie --player-gutter)', () => {
    const used = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))]
    expect(used.length).toBeGreaterThan(8)
    expect(used.filter((name) => rootBlock[name as string] === undefined)).toEqual([])
  })

  it('setzt die Visualizer-Einstellungen in den Fluss unter die Fläche', () => {
    expect(css).toMatch(/\.stage__viz \.viz-controls-bar \{[^}]*position: static;/)
  })

  it('markiert den aktuellen Titel gold mit 1-px-Akzentrahmen', () => {
    expect(css).toMatch(
      /li\.active \{\s*background: var\(--ds-accent-soft\);\s*box-shadow: inset 0 0 0 var\(--ds-border-width\) var\(--ds-accent\);/
    )
  })

  it('stapelt Titel, Tasten und Fortschritt der Player-Leiste bis 480 px', () => {
    const mobile = css.match(/@media \(max-width: 480px\) \{([\s\S]*)\}\s*$/)?.[1] ?? ''
    expect(mobile).toMatch(/grid-template-columns: minmax\(0, 1fr\);/)
    expect(mobile).toMatch(/'track'\s*'controls'\s*'progress'/)
  })
})
