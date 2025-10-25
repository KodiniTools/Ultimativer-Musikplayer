<template>
  <div class="progress-container" aria-label="Wiedergabefortschritt">
    <span class="timechip">{{ formatTime(store.currentTime) }}</span>
    <div 
      class="progress-bar" 
      role="slider" 
      aria-valuemin="0" 
      aria-valuemax="100" 
      :aria-valuenow="Math.round(store.progress)"
      tabindex="0"
      @click="handleSeek"
      @keydown="handleKeydown"
    >
      <div :style="{ width: store.progress + '%' }"></div>
    </div>
    <span class="timechip">-{{ formatTime(store.remainingTime) }}</span>
  </div>
</template>

<script setup>
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()

const emit = defineEmits(['seek'])

const formatTime = (seconds) => {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' + secs : secs}`
}

const handleSeek = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const percentage = ratio * 100
  emit('seek', percentage)
}

const handleKeydown = (event) => {
  if (event.key === 'ArrowRight') {
    const newPercentage = Math.min(100, store.progress + 5)
    emit('seek', newPercentage)
  } else if (event.key === 'ArrowLeft') {
    const newPercentage = Math.max(0, store.progress - 5)
    emit('seek', newPercentage)
  }
}
</script>
