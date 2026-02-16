<template>
  <div class="volume-control" aria-label="Lautstärke">
    <button
      class="control-btn-sm"
      :class="{ 'active-mode': store.isMuted }"
      :aria-pressed="store.isMuted"
      @click="emit('toggleMute')"
      aria-label="Stumm schalten"
    >
      <i :class="store.isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'"></i>
    </button>
    <input
      type="range"
      class="volume-slider"
      :value="store.volume"
      @input="handleVolumeChange"
      min="0"
      max="1"
      step="0.01"
      aria-label="Lautstärke"
    />
  </div>
</template>

<script setup>
import { usePlayerStore } from './stores/playerStore'

const store = usePlayerStore()

const emit = defineEmits(['setVolume', 'toggleMute'])

const handleVolumeChange = (event) => {
  emit('setVolume', parseFloat(event.target.value))
}
</script>
