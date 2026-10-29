import { describe, it, expect } from 'vitest'
import { getSharedSource, withoutSourceParam } from '../utils/sharedFileRepository'
import de from '../i18n/locales/de.js'
import en from '../i18n/locales/en.js'

describe('getSharedSource', () => {
  it.each([
    ['?source=audionormalizer', 'audionormalizer'],
    ['?source=playlistkonverter', 'playlistkonverter'],
    ['?lang=de&source=playlistkonverter', 'playlistkonverter'],
  ])('erkennt %s', (search, expected) => {
    expect(getSharedSource(search)).toBe(expected)
  })

  it.each(['', '?source=', '?source=unknown', '?foo=playlistkonverter'])(
    'ignoriert %s',
    (search) => {
      expect(getSharedSource(search)).toBeNull()
    }
  )
})

describe('withoutSourceParam', () => {
  it.each([
    [
      'https://kodinitools.com/ultimativer-musikplayer/app/?source=playlistkonverter',
      '/ultimativer-musikplayer/app/',
    ],
    [
      'https://kodinitools.com/ultimativer-musikplayer/app/?lang=de&source=audionormalizer#top',
      '/ultimativer-musikplayer/app/?lang=de#top',
    ],
    ['https://kodinitools.com/ultimativer-musikplayer/app/', '/ultimativer-musikplayer/app/'],
  ])('%s → %s', (href, expected) => {
    expect(withoutSourceParam(href)).toBe(expected)
  })
})

describe('Texte für die Playlist-Übergabe', () => {
  it.each([
    ['de', de],
    ['en', en],
  ])('%s hat shared.playlist.loading/loaded', (_, messages) => {
    expect(messages.shared.playlist.loading).toEqual(expect.any(String))
    expect(messages.shared.playlist.loaded).toEqual(expect.any(String))
  })
})
