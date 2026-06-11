<template>
  <div class="visualizer" aria-label="Audio-Visualizer">
    <canvas id="vizCanvas" ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayerStore } from './stores/playerStore'
import { useVisualizer } from './composables/useVisualizer'

const props = defineProps({
  analyser: { type: Object, default: null },
  dataArray: { type: Object, default: null },
  timeDomainArray: { type: Object, default: null },
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
