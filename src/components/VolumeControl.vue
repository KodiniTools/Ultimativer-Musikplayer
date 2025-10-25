<template>
  <div class="volume-control" aria-label="Lautstärke">
    <i class="fa-solid fa-volume-high"></i>
    <input 
      type="range" 
      :value="store.volume"
      @input="handleVolumeChange"
      min="0" 
      max="1" 
      step="0.01" 
    />
    <button 
      class="pill-button" 
      :class="{ 'active-mode': store.isMuted }"
      :aria-pressed="store.isMuted"
      @click="emit('toggleMute')"
    >
      {{ store.isMuted ? t('player.unmute') : t('player.mute') }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@/stores/playerStore'

const { t } = useI18n()
const store = usePlayerStore()

const emit = defineEmits(['setVolume', 'toggleMute'])

const handleVolumeChange = (event) => {
  emit('setVolume', parseFloat(event.target.value))
}
</script>
