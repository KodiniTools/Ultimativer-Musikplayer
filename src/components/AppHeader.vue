<template>
  <header class="app__header">
    <div class="brand">
      <h1 id="main-title">{{ t('nav.title') }}</h1>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
