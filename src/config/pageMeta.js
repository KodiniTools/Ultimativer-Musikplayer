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
