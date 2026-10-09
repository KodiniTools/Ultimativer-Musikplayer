import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import i18n from '../i18n'
import { readStoredLocale, readStoredTheme, useSettingsStore } from '../stores/settingsStore'

const NAV_HTML = `
  <nav class="global-nav" data-i18n-aria="aria.mainNav">
    <a data-i18n="nav.ultimatePlayer">Ultimativer Musikplayer</a>
    <button class="global-nav-theme-icon"></button>
    <button class="global-nav-lang-btn active" data-lang="de">DE</button>
    <button class="global-nav-lang-btn" data-lang="en">EN</button>
    <button data-i18n-title="aria.toggleTheme"></button>
  </nav>`

const flushObserver = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('settingsStore', () => {
  let store

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
    document.body.className = ''
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />'
    document.body.innerHTML = NAV_HTML
    i18n.global.locale.value = 'de'
    setActivePinia(createPinia())
  })

  afterEach(() => {
    store?.stopListening()
    store = undefined
  })

  it('startet ohne gespeicherten Wert mit Light und setzt alle Theme-Marker', () => {
    store = useSettingsStore()
    const html = document.documentElement
    expect(store.theme).toBe('light')
    expect(html.getAttribute('data-theme')).toBe('light')
    expect(html.classList.contains('dark')).toBe(false)
    expect(document.body.classList.contains('light-theme')).toBe(true)
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(
      '#f6f5f1'
    )
    expect(document.querySelector('.global-nav-theme-icon').textContent).toBe('🌙')
  })

  it('übernimmt ein gespeichertes Dark-Theme und ignoriert ungültige Werte', () => {
    localStorage.setItem('theme', 'dark')
    expect(readStoredTheme()).toBe('dark')
    localStorage.setItem('theme', 'sepia')
    expect(readStoredTheme()).toBe('light')
    localStorage.setItem('locale', 'fr')
    expect(readStoredLocale()).toBe('de')
  })

  it('toggleTheme schaltet Tokens, Body-Klasse, html.dark, Meta und speichert', async () => {
    store = useSettingsStore()
    store.toggleTheme()
    await nextTick()
    const html = document.documentElement
    expect(html.getAttribute('data-theme')).toBe('dark')
    expect(html.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(
      '#0a1324'
    )
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.querySelector('.global-nav-theme-icon').textContent).toBe('☀️')
  })

  it('folgt Änderungen an html[data-theme] durch die SSI-Navigation', async () => {
    store = useSettingsStore()
    store.startListening()
    document.documentElement.setAttribute('data-theme', 'dark')
    await flushObserver()
    expect(store.theme).toBe('dark')
    await nextTick()
    expect(document.body.classList.contains('light-theme')).toBe(false)
  })

  it('folgt dem theme-changed-Ereignis und ignoriert unbekannte Themes', async () => {
    store = useSettingsStore()
    store.startListening()
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }))
    expect(store.theme).toBe('dark')
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'neon' } }))
    expect(store.theme).toBe('dark')
  })

  it('übersetzt die SSI-Navigation und synchronisiert vue-i18n beim Sprachwechsel', async () => {
    store = useSettingsStore()
    store.startListening()
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'en' } }))
    await nextTick()
    expect(store.locale).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
    expect(localStorage.getItem('locale')).toBe('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(document.querySelector('[data-i18n]').textContent).toBe('Ultimate Music Player')
    expect(document.querySelector('.global-nav').getAttribute('aria-label')).toBe('Main navigation')
    expect(document.querySelector('[data-i18n-title]').getAttribute('title')).toBe('Toggle theme')
    const active = [...document.querySelectorAll('.global-nav-lang-btn.active')]
    expect(active.map((btn) => btn.dataset.lang)).toEqual(['en'])
  })

  it('reagiert auf Klicks auf die Sprach-Buttons der Navigation', async () => {
    store = useSettingsStore()
    store.startListening()
    document.querySelector('[data-lang="en"]').click()
    await nextTick()
    expect(store.locale).toBe('en')
  })

  it('hört nach stopListening nicht mehr zu', async () => {
    store = useSettingsStore()
    store.startListening()
    store.stopListening()
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'en' } }))
    document.documentElement.setAttribute('data-theme', 'dark')
    await flushObserver()
    expect(store.locale).toBe('de')
    expect(store.theme).toBe('light')
  })
})
