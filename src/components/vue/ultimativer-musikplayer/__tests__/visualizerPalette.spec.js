import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BRIGHT_HUE, goldHue } from '../composables/visualizers/utils.js'

const VIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '../composables/visualizers')

describe('Visualizer-Palette (Schwarz-Gold)', () => {
  it('goldHue läuft von Kupfer (30) bis Hellgelb (50)', () => {
    expect(goldHue(0)).toBe(30)
    expect(goldHue(0.6)).toBeCloseTo(42)
    expect(goldHue(1)).toBe(50)
  })

  it('goldHue begrenzt Werte außerhalb von 0…1', () => {
    expect(goldHue(-2)).toBe(30)
    expect(goldHue(5)).toBe(50)
    expect(goldHue(Number.NaN)).toBeNaN()
  })

  it('Hellgelb liegt im Gold-Bereich', () => {
    expect(BRIGHT_HUE).toBeGreaterThanOrEqual(goldHue(0))
    expect(BRIGHT_HUE).toBeLessThanOrEqual(goldHue(1))
  })

  it('kein Visualizer nutzt feste Farbtöne außerhalb von Gold (Hue 28–52)', () => {
    const offending = readdirSync(VIZ_DIR)
      .filter((file) => file.endsWith('.js'))
      .flatMap((file) => {
        const src = readFileSync(join(VIZ_DIR, file), 'utf8')
        return [...src.matchAll(/hsla?\((\d+)\s*,/g)]
          .map((m) => Number(m[1]))
          .filter((hue) => hue < 28 || hue > 52)
          .map((hue) => `${file}: ${hue}`)
      })
    expect(offending).toEqual([])
  })
})
