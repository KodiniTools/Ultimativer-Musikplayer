import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SSI_NAV_TRANSLATIONS, initStaticPartialSync, translateSsiNav } from '../utils/ssiNav'

const flushObserver = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('SSI-Navigation', () => {
  let stop

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.className = ''
    document.body.className = ''
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />'
    document.body.innerHTML = `
      <nav class="global-nav">
        <span data-i18n="nav.contact">Kontakt</span>
        <span class="global-nav-theme-icon"></span>
        <button class="global-nav-lang-btn" data-lang="de">DE</button>
        <button class="global-nav-lang-btn" data-lang="en">EN</button>
      </nav>`
  })

  afterEach(() => {
    stop?.()
    stop = undefined
  })

  it('hat für DE und EN dieselben Schlüssel', () => {
    expect(Object.keys(SSI_NAV_TRANSLATIONS.en).sort()).toEqual(
      Object.keys(SSI_NAV_TRANSLATIONS.de).sort()
    )
  })

  it('fällt bei unbekannter Sprache auf Deutsch zurück und ignoriert fehlende Navigation', () => {
    translateSsiNav('fr')
    expect(document.querySelector('[data-i18n]').textContent).toBe('Kontakt')
    document.body.innerHTML = ''
    expect(() => translateSsiNav('en')).not.toThrow()
  })

  it('initStaticPartialSync hält Body-Klasse, Meta und Icons beim Theme-Wechsel synchron', async () => {
    stop = initStaticPartialSync()
    expect(document.body.classList.contains('light-theme')).toBe(true)
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(
      '#f6f5f1'
    )

    document.documentElement.setAttribute('data-theme', 'dark')
    await flushObserver()
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(
      '#0a1324'
    )
    expect(document.querySelector('.global-nav-theme-icon').textContent).toBe('☀️')
  })

  it('initStaticPartialSync übersetzt die Navigation aus gespeicherter Sprache und bei Wechsel', () => {
    localStorage.setItem('locale', 'en')
    stop = initStaticPartialSync()
    expect(document.querySelector('[data-i18n]').textContent).toBe('Contact')
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'de' } }))
    expect(document.querySelector('[data-i18n]').textContent).toBe('Kontakt')
    expect(document.querySelector('.global-nav-lang-btn.active').dataset.lang).toBe('de')
  })
})
