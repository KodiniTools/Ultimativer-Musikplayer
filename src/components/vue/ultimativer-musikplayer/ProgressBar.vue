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
      @mousedown="startDrag"
      @touchstart.passive="startTouchDrag"
      @click="handleSeek"
      @keydown="handleKeydown"
    >
      <div class="progress-bar__fill" :style="{ width: store.progress + '%' }"></div>
    </div>
    <span class="timechip">-{{ formatTime(store.remainingTime) }}</span>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { usePlayerStore } from './stores/playerStore'

const store = usePlayerStore()
const emit  = defineEmits(['seek'])

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' + secs : secs}`
}

const percentageFromEvent = (event, element) => {
  const rect  = element.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  return Math.max(0, Math.min(100, ratio * 100))
}

const handleSeek = (event) => {
  emit('seek', percentageFromEvent(event, event.currentTarget))
}

// ── Mouse drag ──────────────────────────────────────────────
let dragBar = null

const onMouseMove = (event) => {
  if (!dragBar) return
  emit('seek', percentageFromEvent(event, dragBar))
}

const onMouseUp = () => {
  dragBar = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
}

const startDrag = (event) => {
  dragBar = event.currentTarget
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup',   onMouseUp)
}

// ── Touch drag ──────────────────────────────────────────────
let touchBar = null

const onTouchMove = (event) => {
  if (!touchBar) return
  const touch = event.touches[0]
  const rect  = touchBar.getBoundingClientRect()
  const ratio = (touch.clientX - rect.left) / rect.width
  emit('seek', Math.max(0, Math.min(100, ratio * 100)))
}

const onTouchEnd = () => {
  touchBar = null
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend',  onTouchEnd)
}

const startTouchDrag = (event) => {
  touchBar = event.currentTarget
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend',  onTouchEnd)
}

// ── Keyboard ────────────────────────────────────────────────
const handleKeydown = (event) => {
  if (event.key === 'ArrowRight') emit('seek', Math.min(100, store.progress + 5))
  else if (event.key === 'ArrowLeft') emit('seek', Math.max(0,  store.progress - 5))
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend',  onTouchEnd)
})
</script>
