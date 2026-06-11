<template>
  <div class="audio-controls" role="group" aria-label="Playersteuerung">
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': store.shufflePlaylist }"
      :aria-pressed="store.shufflePlaylist"
      aria-label="Shuffle"
      @click="store.toggleShuffle()"
    >
      <i class="fas fa-shuffle"></i>
    </button>
    <button
      class="control-btn-sm"
      aria-label="Vorheriger Titel"
      @click="emit('playPrevious')"
    >
      <i class="fas fa-backward"></i>
    </button>
    <button
      class="control-btn-sm play-btn"
      :class="{ 'active-mode': store.isPlaying }"
      aria-label="Abspielen"
      @click="emit('play')"
    >
      <i class="fas fa-play"></i>
    </button>
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': !store.isPlaying && !store.isStopped && store.audioFiles.length > 0 }"
      aria-label="Pause"
      @click="emit('pause')"
    >
      <i class="fas fa-pause"></i>
    </button>
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': store.isStopped && store.audioFiles.length > 0 }"
      aria-label="Stopp"
      @click="emit('stop')"
    >
      <i class="fas fa-stop"></i>
    </button>
    <button
      class="control-btn-sm"
      aria-label="Nächster Titel"
      @click="emit('playNext')"
    >
      <i class="fas fa-forward"></i>
    </button>
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': store.loopPlaylist }"
      :aria-pressed="store.loopPlaylist"
      aria-label="Loop"
      @click="store.toggleLoop()"
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
