<template>
  <div class="visualizer" aria-label="Audio-Visualizer">
    <canvas id="vizCanvas" ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  onInit: { type: Function, default: null },
})

const canvasRef = ref(null)

onMounted(() => {
  if (canvasRef.value && props.onInit) {
    props.onInit(canvasRef.value)
  }
})
</script>
