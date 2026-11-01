import { createI18n } from 'vue-i18n'
import de from './locales/de'
import en from './locales/en'
import { resolveInitialLocale } from '../utils/localeSeo'

function readLocale() {
  try {
    return localStorage.getItem('locale')
  } catch {
    return null
  }
}

// ?lang=en (hreflang-Ziel) hat Vorrang vor der gespeicherten Sprache.
const savedLanguage = resolveInitialLocale(globalThis.location?.search ?? '', readLocale())

const i18n = createI18n({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: 'de',
  messages: {
    de,
    en,
  },
})

export default i18n
