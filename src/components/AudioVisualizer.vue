<template>
  <div class="visualizer" aria-label="Audio-Visualizer">
    <canvas ref="canvasRef" id="vizCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useVisualizer } from '@/composables/useVisualizer'

const props = defineProps({
  analyser: Object,
  dataArray: Object,
  timeDomainArray: Object
})

const store = usePlayerStore()
const canvasRef = ref(null)

const { initCanvas } = useVisualizer(
  store,
  () => props.analyser, 
  () => props.dataArray, 
  () => props.timeDomainArray
)

onMounted(() => {
  if (canvasRef.value) {
    initCanvas(canvasRef.value)
  }
})
</script>
