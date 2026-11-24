// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import de from '../i18n/locales/de.js'
import en from '../i18n/locales/en.js'

const source = readFileSync(new URL('../ToolCards.vue', import.meta.url), 'utf8')

const EXPECTED = {
  converter: 'https://kodinitools.com/mp3konverter/',
  playlist: 'https://kodinitools.com/playlistkonverter/',
  equalizer: 'https://kodinitools.com/equaliser19/',
  visualizer: 'https://kodinitools.com/visualizer/',
  normalizer: 'https://kodinitools.com/audionormalisierer/',
  cutter: 'https://kodinitools.com/audio-cutter/',
}

describe('ToolCards', () => {
  it.each(Object.entries(EXPECTED))('%s verweist auf %s', (key, url) => {
    expect(source).toContain(`key: '${key}',\n      url: '${url}'`)
  })

  it.each(Object.keys(EXPECTED))('%s hat Name und Beschreibung in DE und EN', (key) => {
    for (const locale of [de, en]) {
      expect(locale.tools[key].name).toBeTruthy()
      expect(locale.tools[key].desc).toBeTruthy()
    }
  })
})
