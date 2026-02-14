<template>
  <div class="audio-controls" role="group" aria-label="Playersteuerung">
    <button 
      class="control-button" 
      @click="emit('playPrevious')"
      aria-label="Vorheriger Titel"
    >
      <i class="fas fa-backward"></i>
    </button>
    <button 
      class="control-button" 
      @click="emit('play')"
      aria-label="Abspielen"
    >
      <i class="fas fa-play"></i>
    </button>
    <button 
      class="control-button" 
      @click="emit('pause')"
      aria-label="Pause"
    >
      <i class="fas fa-pause"></i>
    </button>
    <button 
      class="control-button" 
      @click="emit('stop')"
      aria-label="Stopp"
    >
      <i class="fas fa-stop"></i>
    </button>
    <button 
      class="control-button" 
      @click="emit('playNext')"
      aria-label="Nächster Titel"
    >
      <i class="fas fa-forward"></i>
    </button>
    <button 
      class="control-button"
      :class="{ 'active-mode': store.loopPlaylist }"
      :aria-pressed="store.loopPlaylist"
      @click="store.toggleLoop()"
    >
      {{ store.loopPlaylist ? t('player.loop.on') : t('player.loop.off') }}
    </button>
    <button 
      class="control-button"
      :class="{ 'active-mode': store.shufflePlaylist }"
      :aria-pressed="store.shufflePlaylist"
      @click="store.toggleShuffle()"
    >
      {{ store.shufflePlaylist ? t('player.shuffle.on') : t('player.shuffle.off') }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'

const { t } = useI18n()
const store = usePlayerStore()

const emit = defineEmits(['play', 'pause', 'stop', 'playNext', 'playPrevious'])
</script>
