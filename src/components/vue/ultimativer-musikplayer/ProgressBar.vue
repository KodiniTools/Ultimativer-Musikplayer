<template>
  <div class="progress-container" aria-label="Wiedergabefortschritt">
    <span class="timechip">{{ formatTime(displayTime) }}</span>
    <div
      class="progress-bar"
      :class="{ 'progress-bar--dragging': isDragging }"
      role="slider"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(displayProgress)"
      tabindex="0"
      @mousedown="startDrag"
      @touchstart.passive="startTouchDrag"
      @keydown="handleKeydown"
    >
      <div class="progress-bar__fill" :style="{ width: displayProgress + '%' }"></div>
    </div>
    <span class="timechip">-{{ formatTime(displayRemaining) }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { usePlayerStore } from './stores/playerStore'

const store = usePlayerStore()
const emit  = defineEmits(['seek'])

// While dragging we show a local preview position; on release we actually seek.
const isDragging    = ref(false)
const dragProgress  = ref(0)   // 0-100

const displayProgress = computed(() =>
  isDragging.value ? dragProgress.value : store.progress
)
const displayTime = computed(() => {
  if (!isDragging.value) return store.currentTime
  return (dragProgress.value / 100) * store.duration
})
const displayRemaining = computed(() => {
  if (!isDragging.value) return store.remainingTime
  return Math.max(0, store.duration - displayTime.value)
})

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' + secs : secs}`
}

const ratioFromClient = (clientX, element) => {
  const rect = element.getBoundingClientRect()
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

// ── Mouse drag ──────────────────────────────────────────────
let dragEl = null

const onMouseMove = (e) => {
  if (!dragEl) return
  dragProgress.value = ratioFromClient(e.clientX, dragEl) * 100
}

const onMouseUp = (e) => {
  if (dragEl) {
    emit('seek', ratioFromClient(e.clientX, dragEl) * 100)
  }
  isDragging.value = false
  dragEl = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
}

const startDrag = (e) => {
  isDragging.value   = true
  dragProgress.value = store.progress
  dragEl             = e.currentTarget
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup',   onMouseUp)
}

// ── Touch drag ──────────────────────────────────────────────
let touchEl = null

const onTouchMove = (e) => {
  if (!touchEl) return
  dragProgress.value = ratioFromClient(e.touches[0].clientX, touchEl) * 100
}

const onTouchEnd = (e) => {
  if (touchEl) {
    const clientX = e.changedTouches?.[0]?.clientX
    if (clientX != null) emit('seek', ratioFromClient(clientX, touchEl) * 100)
  }
  isDragging.value = false
  touchEl = null
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend',  onTouchEnd)
}

const startTouchDrag = (e) => {
  isDragging.value   = true
  dragProgress.value = store.progress
  touchEl            = e.currentTarget
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend',  onTouchEnd)
}

// ── Keyboard ────────────────────────────────────────────────
const handleKeydown = (e) => {
  if (e.key === 'ArrowRight') emit('seek', Math.min(100, store.progress + 5))
  else if (e.key === 'ArrowLeft') emit('seek', Math.max(0, store.progress - 5))
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend',  onTouchEnd)
})
</script>
