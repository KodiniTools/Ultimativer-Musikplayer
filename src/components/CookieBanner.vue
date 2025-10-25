<template>
  <div v-if="showBanner" class="cookie-banner show">
    <div class="cookie-content">
      <p v-html="t('cookie.notice')"></p>
      <div class="cookie-actions">
        <button class="pill-button" @click="acceptCookies">
          {{ t('cookie.accept') }}
        </button>
        <button class="pill-button" @click="declineCookies">
          {{ t('cookie.decline') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showBanner = ref(false)

onMounted(() => {
  const consent = localStorage.getItem('cookieConsent')
  if (!consent) {
    showBanner.value = true
  }
})

const acceptCookies = () => {
  localStorage.setItem('cookieConsent', 'accepted')
  showBanner.value = false
}

const declineCookies = () => {
  localStorage.setItem('cookieConsent', 'declined')
  showBanner.value = false
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-elevated);
  border: 2px solid var(--border-light);
  border-radius: 20px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  box-shadow: var(--shadow-elevated);
  backdrop-filter: blur(20px);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cookie-banner.show {
  opacity: 1;
}

.cookie-content p {
  margin: 0 0 15px 0;
  color: var(--text-secondary);
}

.cookie-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>
