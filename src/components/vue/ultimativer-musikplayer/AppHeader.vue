<template>
  <header class="app__header">
    <a
      :href="LANDING_URL"
      class="app__home"
      :aria-label="t('nav.homeAria')"
      :title="t('nav.homeAria')"
    >
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
      <span class="app__home-label">{{ t('nav.home') }}</span>
    </a>
    <div class="brand">
      <h1 id="main-title">{{ t('nav.title') }}</h1>
    </div>
  </header>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'

  /** Landing-Page des Musikplayers (Astro-Base /ultimativer-musikplayer). */
  const LANDING_URL = '/ultimativer-musikplayer/'

  const { t } = useI18n()
</script>
