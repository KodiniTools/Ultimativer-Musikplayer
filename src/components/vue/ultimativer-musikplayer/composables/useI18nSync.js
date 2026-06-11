import { onMounted, onUnmounted } from 'vue'
import i18n from '../i18n'

export function useI18nSync() {
  function setLocale(lang) {
    if (!lang || lang === i18n.global.locale.value) return
    i18n.global.locale.value = lang
  }

  const onNavLangClick = (e) => {
    const btn = e.target.closest('.global-nav-lang-btn')
    if (btn) setLocale(btn.getAttribute('data-lang'))
  }

  const onLocaleChanged = (e) => setLocale(e.detail?.locale)

  onMounted(() => {
    document.addEventListener('click', onNavLangClick)
    window.addEventListener('locale-changed', onLocaleChanged)
  })

  onUnmounted(() => {
    document.removeEventListener('click', onNavLangClick)
    window.removeEventListener('locale-changed', onLocaleChanged)
  })
}
