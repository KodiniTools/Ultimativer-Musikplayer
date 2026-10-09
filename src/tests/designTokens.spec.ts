/**
 * Regressionsschutz für die Design-Tokens der Oberfläche.
 *
 * Portiert aus KodiniTools/Collage-Maker (src/tests/designTokens.spec.ts). Dort
 * prüft der Test Tailwind-Klassen; der Musikplayer hat kein Tailwind, deshalb
 * prüft er hier die CSS-Deklarationen selbst: main.css, die <style>-Blöcke
 * aller Vue-Komponenten und die der Astro-Seiten. Er verhindert die Rückkehr
 * der alten Glas-/3D-Palette, von Gradients, Blur, Glow, Skalierung, freien
 * Schriftgrößen, Radien und Schatten und stellt sicher, dass Supreme in allen
 * genutzten Gewichten geladen wird und das Theme vor dem ersten Paint steht.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { themeColorsV2 } from '../design-system/tokens-v2'

const SRC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MAIN_CSS = join(SRC_DIR, 'assets/styles/main.css')

function collectFiles(dir: string, extension: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectFiles(full, extension, out)
    else if (entry.endsWith(extension)) out.push(full)
  }
  return out
}

interface StyleSource {
  file: string
  css: string
}

/** main.css plus alle <style>-Blöcke aus .vue- und .astro-Dateien, ohne Kommentare. */
function styleSources(): StyleSource[] {
  const sources: StyleSource[] = [{ file: MAIN_CSS, css: readFileSync(MAIN_CSS, 'utf8') }]
  const components = [...collectFiles(SRC_DIR, '.vue'), ...collectFiles(SRC_DIR, '.astro')]
  for (const file of components) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      sources.push({ file, css: match[1] ?? '' })
    }
  }
  return sources.map(({ file, css }) => ({ file, css: css.replace(/\/\*[\s\S]*?\*\//g, '') }))
}

interface Declaration {
  where: string
  property: string
  value: string
}

function declarations(): Declaration[] {
  const result: Declaration[] = []
  for (const { file, css: raw } of styleSources()) {
    // @font-face beschreibt Schriftdateien, keine Oberfläche
    const css = raw.replace(/@font-face\s*\{[^}]*\}/g, '')
    for (const match of css.matchAll(/(?:^|[;{\s])([a-z-]+)\s*:\s*([^;{}]+);/g)) {
      const property = match[1] ?? ''
      const value = (match[2] ?? '').replace(/\s+/g, ' ').trim()
      result.push({ where: `${relative(SRC_DIR, file)}: ${property}: ${value}`, property, value })
    }
  }
  return result
}

const ALL = declarations()
const offending = (predicate: (d: Declaration) => boolean) =>
  ALL.filter(predicate).map((d) => d.where)

describe('Design-Tokens in Styles', () => {
  it('findet die Styles aller Komponenten', () => {
    expect(styleSources().length).toBeGreaterThanOrEqual(8)
    expect(ALL.length).toBeGreaterThan(300)
  })

  it('referenzieren nur --ds-* oder lokal deklarierte Variablen (keine Glas-/3D-Palette)', () => {
    const failures = styleSources().flatMap(({ file, css }) => {
      const local = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
      return [...css.matchAll(/var\((--[a-z0-9-]+)/g)]
        .map((m) => m[1] as string)
        .filter((name) => !name.startsWith('--ds-') && !local.has(name))
        .map((name) => `${relative(SRC_DIR, file)}: ${name}`)
    })
    expect(failures).toEqual([])
  })

  it('deklarieren lokal nur --ds-freie Hilfsvariablen ohne festen Farbwert', () => {
    expect(
      offending(
        (d) =>
          d.property.startsWith('--') && !d.property.startsWith('--ds-') && /#|rgb/.test(d.value)
      )
    ).toEqual([])
  })

  it('nutzen keine Gradients, Blur, Glow, Drop-Shadow oder color-mix', () => {
    expect(
      offending(
        (d) =>
          /gradient\(|blur\(|drop-shadow\(|color-mix\(/.test(d.value) ||
          d.property === 'backdrop-filter' ||
          d.property === '-webkit-backdrop-filter'
      )
    ).toEqual([])
  })

  it('ändern bei Hover nie die Größe (kein scale, keine 3D-Transformation)', () => {
    expect(
      offending((d) =>
        /\bscale[XYZ3d]*\(|translateZ|perspective|preserve-3d/.test(`${d.property} ${d.value}`)
      )
    ).toEqual([])
  })

  it('animieren nichts dauerhaft', () => {
    expect(offending((d) => d.property === 'animation' && !/0\.01ms/.test(d.value))).toEqual([])
    const keyframes = styleSources().filter(({ css }) => /@keyframes/.test(css))
    expect(keyframes.map(({ file }) => relative(SRC_DIR, file))).toEqual([])
  })

  it('nutzen nur Token-Dauern', () => {
    expect(
      offending(
        (d) =>
          /^transition/.test(d.property) &&
          /\d(?:\.\d+)?m?s\b/.test(d.value) &&
          !/0\.01ms/.test(d.value)
      )
    ).toEqual([])
  })

  it('bleiben in der Token-Skala für Schriftgrade', () => {
    expect(
      offending(
        (d) => d.property === 'font-size' && !/^var\(--ds-(text|icon)-[a-z0-9]+\)$/.test(d.value)
      )
    ).toEqual([])
  })

  it('nutzen nur Token-Gewichte', () => {
    expect(
      offending((d) => d.property === 'font-weight' && !/^var\(--ds-weight-[a-z]+\)$/.test(d.value))
    ).toEqual([])
  })

  it('nutzen nur die drei Radien (plus Pille und Kreis)', () => {
    expect(
      offending(
        (d) =>
          d.property === 'border-radius' &&
          !/^(var\(--ds-radius-(sm|md|lg|full)\)|50%|inherit)$/.test(d.value)
      )
    ).toEqual([])
  })

  it('setzen Schatten nur für Overlays, Fokus und den 1-px-Auswahlrahmen', () => {
    const allowed = [
      'none',
      'var(--ds-shadow-overlay)',
      'var(--ds-focus-ring)',
      'inset 0 0 0 var(--ds-border-width) var(--ds-accent)',
    ]
    expect(offending((d) => d.property === 'box-shadow' && !allowed.includes(d.value))).toEqual([])
  })

  it('nutzen keine festen Farbwerte (außer Leinwand-Schwarz und Backdrop)', () => {
    expect(
      offending((d) => {
        if (d.property.startsWith('--')) return false
        const hex = d.value.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
        const rgb = d.value.match(/rgba?\([^)]*\)/g) ?? []
        return (
          hex.some((value) => value.toLowerCase() !== '#000') ||
          rgb.some((value) => value.replace(/\s/g, '') !== 'rgba(0,0,0,0.5)')
        )
      })
    ).toEqual([])
  })

  it('nutzen keine Outline-Fokusringe', () => {
    expect(offending((d) => d.property === 'outline' && d.value !== 'none')).toEqual([])
  })
})

describe('Templates', () => {
  it('Astro-Seiten setzen keine Inline-Styles', () => {
    const hits = collectFiles(SRC_DIR, '.astro').filter((file) =>
      / style="/.test(readFileSync(file, 'utf8'))
    )
    expect(hits.map((file) => relative(SRC_DIR, file))).toEqual([])
  })

  it('Vue-Komponenten setzen keine dark-/light-spezifischen Selektoren', () => {
    const hits = collectFiles(SRC_DIR, '.vue').filter((file) =>
      /data-theme|light-theme|\.dark\b/.test(readFileSync(file, 'utf8'))
    )
    expect(hits.map((file) => relative(SRC_DIR, file))).toEqual([])
  })
})

describe('Typografie', () => {
  const mainCss = readFileSync(MAIN_CSS, 'utf8')

  it('setzt Schrift und Grundgröße des Body aus den Tokens', () => {
    expect(mainCss).toMatch(/body \{[^}]*font-family: var\(--ds-font-sans\)/)
    expect(mainCss).toMatch(/body \{[^}]*font-size: var\(--ds-text-lg\)/)
    expect(mainCss).toMatch(/body \{[^}]*background: var\(--ds-surface-0\)/)
  })

  it.each([400, 500, 700])(
    'deklariert @font-face für Supreme %i aus gebündelter Datei',
    (weight) => {
      const faces = mainCss.match(/@font-face\s*{[^}]*}/g) ?? []
      const supremeFaces = faces.filter((face) => /font-family:\s*'Supreme'/.test(face))
      const match = supremeFaces.find((face) =>
        new RegExp(`font-weight:\\s*${weight}\\b`).test(face)
      )
      expect(match, `Kein @font-face für Supreme ${weight}`).toBeDefined()
      const url = match?.match(/url\('([^']+)'\)/)?.[1] ?? ''
      expect(url).toMatch(/^\.\.\/fonts\/Supreme-(Regular|Medium|Bold)\.woff2$/)
      expect(existsSync(resolve(dirname(MAIN_CSS), url))).toBe(true)
    }
  )
})

describe('Theme vor dem ersten Paint', () => {
  const pages = collectFiles(join(SRC_DIR, 'pages'), '.astro')

  it.each(pages.map((file) => relative(SRC_DIR, file)))('%s', (page) => {
    const text = readFileSync(join(SRC_DIR, page), 'utf8')
    const head = text.slice(0, text.indexOf('</head>'))
    expect(head).toMatch(
      /<script is:inline>[\s\S]*localStorage\.getItem\('theme'\)[\s\S]*data-theme/
    )
    expect(head).toContain(
      `<meta name="theme-color" content="${themeColorsV2('light').surface0}" />`
    )
    expect(head).toContain(themeColorsV2('dark').surface0)
    expect(text).toMatch(/<body>\s*<script is:inline>[\s\S]*light-theme/)
  })
})
