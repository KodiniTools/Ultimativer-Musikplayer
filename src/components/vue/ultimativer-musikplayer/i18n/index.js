import { createI18n } from 'vue-i18n'
import de from './locales/de'
import en from './locales/en'

const savedLanguage = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) || 'de'

const i18n = createI18n({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: 'de',
  messages: {
    de,
    en
  }
})

export default i18n
