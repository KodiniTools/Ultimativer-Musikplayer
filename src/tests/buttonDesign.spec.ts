// @vitest-environment node
/**
 * Buttons: gefüllte Gold-Buttons übernehmen das Design des Playlist Generators
 * (Hintergrund --ds-accent-fill, Text --ds-on-accent-fill, Hover --ds-accent-fill-hover).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { contrastRatio, parseBlock } from '../design-system/__tests__/tokenTestUtils'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const v2 = read('../design-system/tokens-v2.css')
const norm = read('../design-system/tokens-normalizer.css')
const landingCss = strip(read('../assets/styles/kodini-landing.css'))
const mainCss = strip(read('../assets/styles/main.css'))
const headerCss = strip(read('../assets/styles/kodini-header-stage2.css'))
const uploader = strip(read('../components/vue/ultimativer-musikplayer/AudioUploader.vue'))

const BLOCKS: [string, Record<string, string>, string][] = [
  ['tokens-v2 dark', parseBlock(v2, ':root', 'tokens-v2.css'), '#9a6b24'],
  ['tokens-v2 light', parseBlock(v2, '.light-theme', 'tokens-v2.css'), '#7d561c'],
  ['tokens-v2 data-theme light', parseBlock(v2, ":root[data-theme='light']", 'tokens-v2.css'), '#7d561c'],
  ['normalizer dark', parseBlock(norm, 'html.kodini-player-page--landing', 'tokens-normalizer.css'), '#9a6b24'],
  ['normalizer light', parseBlock(norm, "html.kodini-player-page--landing[data-theme='light'] body", 'tokens-normalizer.css'), '#7d561c'],
] // prettier-ignore

describe('Button-Tokens (Vorbild Playlist Generator)', () => {
  it.each(BLOCKS)('%s: Füllung, Hover und Text wie im Playlist Generator', (_n, block, hover) => {
    expect(block['--ds-accent-fill']).toBe('#8f6320')
    expect(block['--ds-accent-fill-hover']).toBe(hover)
    expect(block['--ds-on-accent-fill']).toBe('#ffffff')
  })

  it.each(BLOCKS)('%s: Text auf Füllung und Hover erreicht 4.5:1', (_n, block) => {
    for (const bg of ['--ds-accent-fill', '--ds-accent-fill-hover'])
      expect(
        contrastRatio(block['--ds-on-accent-fill'] as string, block[bg] as string)
      ).toBeGreaterThanOrEqual(4.5)
  })
})

describe('Gefüllte Gold-Buttons nutzen die Fill-Tokens', () => {
  it('Landingpage: .btn-hero', () => {
    expect(landingCss).toMatch(
      /\.landing-page \.btn-hero \{[^}]*background: var\(--ds-accent-fill\);\s*color: var\(--ds-on-accent-fill\);/
    )
    expect(landingCss).toMatch(
      /\.landing-page \.btn-hero:hover \{\s*background: var\(--ds-accent-fill-hover\);\s*color: var\(--ds-on-accent-fill\);/
    )
  })

  it('Player: Wiedergabe-Taste', () => {
    expect(mainCss).toMatch(
      /\.pbar-btn--play \{[^}]*background: var\(--ds-accent-fill\);\s*color: var\(--ds-on-accent-fill\);/
    )
    expect(mainCss).toMatch(
      /\.pbar-btn--play:hover \{[^}]*background: var\(--ds-accent-fill-hover\);/
    )
  })

  it('Uploader: Hauptaktion', () => {
    expect(uploader).toMatch(
      /\.uploader__btn--primary \{[^}]*background: var\(--ds-accent-fill\);\s*color: var\(--ds-on-accent-fill\);/
    )
    expect(uploader).toMatch(
      /\.uploader__btn--primary:hover \{[^}]*background: var\(--ds-accent-fill-hover\);/
    )
  })

  it('Navigation: aktive Sprache', () => {
    expect(headerCss).toContain('--nav-selected: var(--ds-accent-fill);')
    expect(headerCss).toContain('--nav-on-selected: var(--ds-on-accent-fill);')
  })

  it('kein Button kombiniert mehr --ds-accent als Fläche mit --ds-on-accent als Text', () => {
    for (const css of [landingCss, mainCss, uploader])
      expect(css).not.toMatch(
        /\.(btn-hero|pbar-btn--play|uploader__btn--primary)[^{]*\{[^}]*--ds-on-accent\)/
      )
  })
})

describe('Sprachumschalter in der SSI-Navigation', () => {
  it('markiert die aktive Sprache mit !important und Fill-Tokens (wie Playlist Generator)', () => {
    expect(headerCss).toMatch(
      /\.global-nav-lang-btn\.active\.active\.active \{\s*background: var\(--nav-selected\) !important;\s*color: var\(--nav-on-selected\) !important;/
    )
  })
})
