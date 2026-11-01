import { applyLocaleHead } from './localeSeo'

export const APP_URL = 'https://kodinitools.com/ultimativer-musikplayer/app/'

/** Titel und Beschreibung der App-Seite je Sprache (Deutsch steht auch in app.astro). */
export const APP_META = {
  de: {
    title: 'Ultimativer Musikplayer - KodiniTools',
    description:
      'Kostenloser Online-Musikplayer mit Audio-Visualisierung. Unterstützt MP3, WAV, FLAC, M4A, OGG.',
  },
  en: {
    title: 'Ultimate Music Player - KodiniTools',
    description:
      'Free online music player with audio visualization. Supports MP3, WAV, FLAC, M4A, OGG.',
  },
}

/** Sprache, Titel, Canonical und hreflang der App-Seite setzen. */
export function applyAppHead(locale) {
  applyLocaleHead(APP_URL, locale, APP_META[locale] ?? APP_META.de)
}
