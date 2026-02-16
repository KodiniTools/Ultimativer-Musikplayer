<template>
  <div class="audio-controls" role="group" aria-label="Playersteuerung">
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': store.shufflePlaylist }"
      :aria-pressed="store.shufflePlaylist"
      @click="store.toggleShuffle()"
      aria-label="Shuffle"
    >
      <i class="fas fa-shuffle"></i>
    </button>
    <button
      class="control-btn-sm"
      @click="emit('playPrevious')"
      aria-label="Vorheriger Titel"
    >
      <i class="fas fa-backward"></i>
    </button>
    <button
      class="control-btn-sm play-btn"
      @click="emit('play')"
      aria-label="Abspielen"
    >
      <i class="fas fa-play"></i>
    </button>
    <button
      class="control-btn-sm"
      @click="emit('pause')"
      aria-label="Pause"
    >
      <i class="fas fa-pause"></i>
    </button>
    <button
      class="control-btn-sm"
      @click="emit('stop')"
      aria-label="Stopp"
    >
      <i class="fas fa-stop"></i>
    </button>
    <button
      class="control-btn-sm"
      @click="emit('playNext')"
      aria-label="Nächster Titel"
    >
      <i class="fas fa-forward"></i>
    </button>
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': store.loopPlaylist }"
      :aria-pressed="store.loopPlaylist"
      @click="store.toggleLoop()"
      aria-label="Loop"
    >
      <i class="fas fa-repeat"></i>
    </button>
  </div>
</template>

<script setup>
import { usePlayerStore } from './stores/playerStore'

const store = usePlayerStore()

const emit = defineEmits(['play', 'pause', 'stop', 'playNext', 'playPrevious'])
</script>
