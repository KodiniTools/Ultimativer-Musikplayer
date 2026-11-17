// Titel und Beschreibung der Landingpage je Sprache, ohne Laufzeit-Abhängigkeiten,
// damit die Seite (index.astro) und der Build (astro.config.mjs) dieselbe Quelle nutzen.

/**
 * Deutsch steht zusätzlich statisch im <head> von index.astro, Englisch schreibt der
 * Build in index.en.html (siehe astro.config.mjs und utils/localizeHtml.js).
 */
export const pageMeta = {
  url: 'https://kodinitools.com/ultimativer-musikplayer/',
  de: {
    title: 'MP3 Player online – Musikplayer mit Visualizer | KodiniTools',
    description:
      'MP3 Player online und kostenlos: Musik im Browser abspielen mit 7 Visualisierungen, Playlist und Equalizer. Für MP3, WAV, FLAC, M4A, OGG. Ohne Registrierung.',
  },
  en: {
    title: 'Online MP3 Player – Music Player with Visualizer | KodiniTools',
    description:
      'Free online MP3 player: play music in your browser with 7 visualizer modes, playlist and equalizer. Supports MP3, WAV, FLAC, M4A, OGG. No sign-up required.',
  },
}

/**
 * App-Seite (/ultimativer-musikplayer/app/). Deutsch steht statisch im <head> von app.astro,
 * Englisch schreibt der Build in app/index.en.html.
 */
export const appMeta = {
  url: 'https://kodinitools.com/ultimativer-musikplayer/app/',
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

/**
 * Englische Sprachfassungen, die der Build schreibt: `source` ist die deutsche Seite in
 * dist/, `file` die englische Fassung daneben. nginx wählt sie für `?lang=en` über die
 * index-Direktive (index.en.html vor index.html), in jedem Verzeichnis.
 */
export const EN_PAGES = [
  {
    source: 'ultimativer-musikplayer/index.html',
    file: 'ultimativer-musikplayer/index.en.html',
    meta: pageMeta,
  },
  {
    source: 'ultimativer-musikplayer/app/index.html',
    file: 'ultimativer-musikplayer/app/index.en.html',
    meta: appMeta,
  },
]
