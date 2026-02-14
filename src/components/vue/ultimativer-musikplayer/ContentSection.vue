<template>
  <section class="content-section">
    <h2 v-html="t('content.title')"></h2>
    <p>{{ t('content.subtitle') }}</p>
    
    <h3 v-html="t('content.features.title')"></h3>
    <ul>
      <li><span v-html="t('content.features.visualization')"></span></li>
      <li><span v-html="t('content.features.formats')"></span></li>
      <li><span v-html="t('content.features.playlist')"></span></li>
      <li><span v-html="t('content.features.responsive')"></span></li>
      <li><span v-html="t('content.features.theme')"></span></li>
      <li><span v-html="t('content.features.free')"></span></li>
    </ul>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
