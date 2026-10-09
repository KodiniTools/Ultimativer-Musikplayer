/**
 * Angleichung der SSI-Partials (globale Navigation, Footer, Cookie-Banner) an
 * den Zustand der App. Übernommen aus KodiniTools/Collage-Maker
 * (src/stores/settings.ts). Die Schlüssel müssen den data-i18n-Attributen in
 * /partials/nav.html entsprechen.
 */

import { themeColorsV2 } from '../../../../design-system/tokens-v2'

export const SSI_NAV_TRANSLATIONS = {
  de: {
    'nav.audioTools': 'Audiotools',
    'nav.mp3Converter': 'MP3 Konverter',
    'nav.audioEqualizer': 'Interaktiver Audio Equalizer',
    'nav.modernPlayer': 'Moderner Musikplayer',
    'nav.ultimatePlayer': 'Ultimativer Musikplayer',
    'nav.playlistGenerator': 'Wiedergabeliste Generator',
    'nav.playlistConverter': 'Wiedergabeliste Konverter',
    'nav.alarmTool': 'Alarmtool',
    'nav.audioNormalizer': 'Audio Normalizer',
    'nav.visualizer': 'Visualizer',
    'nav.equalizer19': '19-Band Equalizer',
    'nav.audioConverter': 'Audio Konverter',
    'nav.imageTools': 'Bildtools',
    'nav.imageConverter': 'Bildkonverter',
    'nav.batchImageEditor': 'Bildserie bearbeiten',
    'nav.photoCollage': 'Fotocollage',
    'nav.tools': 'Tools',
    'nav.colorExtractor': 'Kodini Farbextraktor',
    'nav.videoConverter': 'Videokonverter',
    'nav.contact': 'Kontakt',
    'aria.toggleTheme': 'Theme wechseln',
    'aria.selectLanguage': 'Sprache wählen',
    'aria.menuOpen': 'Menü öffnen',
    'aria.menuClose': 'Menü schliessen',
    'aria.mainNav': 'Hauptnavigation',
  },
  en: {
    'nav.audioTools': 'Audio Tools',
    'nav.mp3Converter': 'MP3 Converter',
    'nav.audioEqualizer': 'Interactive Audio Equalizer',
    'nav.modernPlayer': 'Modern Music Player',
    'nav.ultimatePlayer': 'Ultimate Music Player',
    'nav.playlistGenerator': 'Audio Playlist Generator',
    'nav.playlistConverter': 'Playlist to WebM Converter',
    'nav.alarmTool': 'Alarm Tool',
    'nav.audioNormalizer': 'Audio Normalizer',
    'nav.visualizer': 'Visualizer',
    'nav.equalizer19': '19-Band Equalizer',
    'nav.audioConverter': 'Audio Converter',
    'nav.imageTools': 'Image Tools',
    'nav.imageConverter': 'Image Converter',
    'nav.batchImageEditor': 'Batch Image Editor',
    'nav.photoCollage': 'Photo Collage',
    'nav.tools': 'Tools',
    'nav.colorExtractor': 'Kodini Color Extractor',
    'nav.videoConverter': 'Video Converter',
    'nav.contact': 'Contact',
    'aria.toggleTheme': 'Toggle theme',
    'aria.selectLanguage': 'Select language',
    'aria.menuOpen': 'Open menu',
    'aria.menuClose': 'Close menu',
    'aria.mainNav': 'Main navigation',
  },
}

/** Übersetzt alle Texte, aria-labels und Titel der SSI-Navigation. */
export function translateSsiNav(lang, root = document) {
  const strings = SSI_NAV_TRANSLATIONS[lang] || SSI_NAV_TRANSLATIONS.de
  const nav = root.querySelector('.global-nav')
  if (!nav) return

  // Das <nav> selbst trägt aria-label="Hauptnavigation", daher inklusive Wurzel
  const withRoot = (selector) => [
    ...(nav.matches(selector) ? [nav] : []),
    ...nav.querySelectorAll(selector),
  ]

  withRoot('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (key && strings[key]) el.textContent = strings[key]
  })
  withRoot('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')
    if (key && strings[key]) el.setAttribute('aria-label', strings[key])
  })
  withRoot('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title')
    if (key && strings[key]) el.setAttribute('title', strings[key])
  })
}

/** Hält die aktive Klasse der Sprach-Buttons der SSI-Navigation synchron. */
export function syncNavLangButtons(lang, root = document) {
  root.querySelectorAll('.global-nav-lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang)
  })
}

/** Zeigt im Theme-Schalter der SSI-Navigation das Symbol des jeweils anderen Themes. */
export function syncNavThemeIcons(theme, root = document) {
  root.querySelectorAll('.global-nav-theme-icon').forEach((icon) => {
    icon.textContent = theme === 'light' ? '🌙' : '☀️'
  })
}

/**
 * Für statische Seiten ohne Vue (Landing-Page): hält body.light-theme,
 * html.dark, meta[theme-color] und die SSI-Navigation synchron, wenn die
 * Navigation html[data-theme] oder die Sprache umschaltet.
 * meta[theme-color] folgt --ds-surface-0 des jeweiligen Themes.
 */
export function initStaticPartialSync(root = document) {
  const html = root.documentElement

  const applyTheme = () => {
    const theme = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    html.classList.toggle('dark', theme === 'dark')
    root.body?.classList.toggle('light-theme', theme === 'light')
    root
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColorsV2(theme).surface0)
    syncNavThemeIcons(theme, root)
  }

  const applyLocale = (lang) => {
    if (!SSI_NAV_TRANSLATIONS[lang]) return
    syncNavLangButtons(lang, root)
    translateSsiNav(lang, root)
  }

  applyTheme()
  let storedLocale = 'de'
  try {
    storedLocale = localStorage.getItem('locale') || 'de'
  } catch {
    // Speicher gesperrt: Standardsprache
  }
  applyLocale(storedLocale)

  const observer = new MutationObserver(applyTheme)
  observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })

  const onLocaleChanged = (e) => applyLocale(e.detail?.locale)
  const onClick = (e) => {
    const btn = e.target instanceof Element ? e.target.closest('.global-nav-lang-btn') : null
    if (btn) applyLocale(btn.getAttribute('data-lang'))
  }
  window.addEventListener('locale-changed', onLocaleChanged)
  root.addEventListener('click', onClick)

  return () => {
    observer.disconnect()
    window.removeEventListener('locale-changed', onLocaleChanged)
    root.removeEventListener('click', onClick)
  }
}
