<template>
  <nav class="nav-tabs" role="navigation" aria-label="Hauptnavigation">
    <a href="https://kodinitools.com/playlist_generator/" class="nav-tab">
      <i class="fa-solid fa-list-music"></i>
      <span>{{ t('nav.playlist') }}</span>
    </a>
    <a href="https://kodinitools.com/modernermusikplayer/" class="nav-tab">
      <i class="fa-solid fa-play-circle"></i>
      <span>{{ t('nav.modern') }}</span>
    </a>
    <a href="https://kodinitools.com/audionormalisierer/" class="nav-tab">
      <i class="fa-solid fa-sliders"></i>
      <span>{{ t('nav.normalizer') }}</span>
    </a>
    <a href="https://kodinitools.com/bildkonverter/" class="nav-tab">
      <i class="fa-solid fa-image"></i>
      <span>{{ t('nav.converter') }}</span>
    </a>
    <span class="nav-tab active">
      <i class="fa-solid fa-wave-square"></i>
      <span>{{ t('nav.current') }}</span>
    </span>
  </nav>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
