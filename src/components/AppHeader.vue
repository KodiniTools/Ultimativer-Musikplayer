<template>
  <header class="app__header">
    <div class="brand">
      <h1 id="main-title">{{ t('nav.title') }}</h1>
    </div>

    <div class="header-actions">
      <div class="language-switcher">
        <button 
          class="lang-btn" 
          :class="{ active: locale === 'de' }"
          @click="changeLanguage('de')"
        >
          DE
        </button>
        <button 
          class="lang-btn" 
          :class="{ active: locale === 'en' }"
          @click="changeLanguage('en')"
        >
          EN
        </button>
      </div>
      <button 
        id="themeToggle" 
        class="icon-button" 
        :aria-label="t('nav.theme')"
        @click="toggleTheme"
      >
        <i :class="theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'

const { t, locale } = useI18n()
const { theme, toggleTheme } = useTheme()

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('musicplayer_language', lang)
  document.documentElement.lang = lang
}
</script>
