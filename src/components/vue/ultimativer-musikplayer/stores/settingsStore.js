import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import i18n from '../i18n'
import { themeColorsV2 } from '../../../../design-system/tokens-v2'
import { syncNavLangButtons, syncNavThemeIcons, translateSsiNav } from '../utils/ssiNav'

const THEMES = ['light', 'dark']
const LOCALES = ['de', 'en']

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Privater Modus / gesperrter Speicher: Zustand gilt nur für diese Sitzung.
  }
}

/** Gespeichertes Theme oder 'light' (Standard wie im Collage Maker). */
export function readStoredTheme() {
  const stored = readStorage('theme')
  return THEMES.includes(stored) ? stored : 'light'
}

/** Gespeicherte Sprache oder 'de'. */
export function readStoredLocale() {
  const stored = readStorage('locale')
  return LOCALES.includes(stored) ? stored : 'de'
}

/**
 * Theme und Sprache der App, synchron mit den SSI-Partials.
 *
 * Theme-Mechanik wie im Collage Maker (src/stores/settings.ts):
 * - html[data-theme] schaltet die Design-Tokens (--ds-*) und die SSI-Navigation,
 * - body.light-theme hält Parität zum Playlist Generator,
 * - html.dark bleibt für externe Skripte erhalten,
 * - meta[name=theme-color] folgt --ds-surface-0.
 * Ein Inline-Skript in den Astro-Seiten setzt data-theme vor dem ersten Paint.
 */
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref(readStoredTheme())
  const locale = ref(readStoredLocale())

  let themeObserver = null
  let ignoreMutation = false
  let listening = false

  function applyTheme(newTheme) {
    const root = document.documentElement
    // Eigene Attribut-Änderung nicht als externe Änderung werten
    ignoreMutation = true
    root.classList.toggle('dark', newTheme === 'dark')
    root.setAttribute('data-theme', newTheme)
    document.body?.classList.toggle('light-theme', newTheme === 'light')
    ignoreMutation = false

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', themeColorsV2(newTheme).surface0)

    syncNavThemeIcons(newTheme)
  }

  watch(
    theme,
    (newTheme) => {
      writeStorage('theme', newTheme)
      applyTheme(newTheme)
    },
    { immediate: true }
  )

  watch(locale, (newLocale) => {
    writeStorage('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
    i18n.global.locale.value = newLocale
    syncNavLangButtons(newLocale)
    translateSsiNav(newLocale)
  })

  function setTheme(newTheme) {
    if (THEMES.includes(newTheme)) theme.value = newTheme
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setLocale(newLocale) {
    if (LOCALES.includes(newLocale)) locale.value = newLocale
  }

  // --- Ereignisse der SSI-Navigation ---
  function onLocaleChanged(e) {
    setLocale(e.detail?.locale)
  }

  function onThemeChanged(e) {
    setTheme(e.detail?.theme)
  }

  function onNavLangClick(e) {
    const btn = e.target instanceof Element ? e.target.closest('.global-nav-lang-btn') : null
    if (btn) setLocale(btn.getAttribute('data-lang'))
  }

  function startThemeObserver() {
    themeObserver = new MutationObserver((mutations) => {
      if (ignoreMutation) return
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          setTheme(document.documentElement.getAttribute('data-theme'))
        }
      }
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  function startListening() {
    if (listening) return
    listening = true
    window.addEventListener('locale-changed', onLocaleChanged)
    window.addEventListener('theme-changed', onThemeChanged)
    document.addEventListener('click', onNavLangClick)
    startThemeObserver()
    // Partials beim Start auf den gespeicherten Zustand bringen
    applyTheme(theme.value)
    syncNavLangButtons(locale.value)
    translateSsiNav(locale.value)
  }

  function stopListening() {
    if (!listening) return
    listening = false
    window.removeEventListener('locale-changed', onLocaleChanged)
    window.removeEventListener('theme-changed', onThemeChanged)
    document.removeEventListener('click', onNavLangClick)
    themeObserver?.disconnect()
    themeObserver = null
  }

  return {
    theme,
    locale,
    setTheme,
    toggleTheme,
    setLocale,
    startListening,
    stopListening,
  }
})
