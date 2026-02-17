<template>
  <section class="tool-cards" :aria-label="t('tools.title')">
    <h2 class="tool-cards__title">{{ t('tools.title') }}</h2>
    <div class="tool-cards__grid">
      <a
        v-for="tool in tools"
        :key="tool.key"
        :href="tool.url"
        class="tool-card"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="tool-card__icon">
          <i :class="tool.icon"></i>
        </div>
        <h3 class="tool-card__name">{{ t(`tools.${tool.key}.name`) }}</h3>
        <p class="tool-card__desc">{{ t(`tools.${tool.key}.desc`) }}</p>
        <span class="tool-card__cta">
          {{ t('tools.cta') }}
          <i class="fa-solid fa-arrow-right"></i>
        </span>
      </a>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tools = [
  {
    key: 'converter',
    url: 'https://kodinitools.com/mp3konverter/',
    icon: 'fa-solid fa-file-audio'
  },
  {
    key: 'playlist',
    url: 'https://kodinitools.com/playlistkonverter/',
    icon: 'fa-solid fa-list-ol'
  },
  {
    key: 'equalizer',
    url: 'https://kodinitools.com/equaliser19/',
    icon: 'fa-solid fa-sliders'
  }
]
</script>
