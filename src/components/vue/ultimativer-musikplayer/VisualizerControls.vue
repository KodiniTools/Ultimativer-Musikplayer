<template>
  <div class="viz-controls" aria-label="Visualizer Einstellungen">
    <select
      :value="store.vizMode"
      @change="store.setVizMode($event.target.value)"
      aria-label="Visualisierungsmodus"
    >
      <option value="ribbon">Ribbon</option>
      <option value="waves">Waves</option>
      <option value="nebula">Nebula</option>
      <option value="spectrum">Spectrum Rays</option>
      <option value="orbits">Orbit Rings</option>
      <option value="starfield">Starfield</option>
      <option value="grid">Grid Pulse</option>
      <option value="aurora">Aurora</option>
      <option value="kaleidoscope">Kaleidoscope</option>
      <option value="particles">Particles</option>
    </select>
    <input
      type="range"
      class="viz-slider"
      :value="store.vizIntensity"
      @input="store.setVizIntensity(parseFloat($event.target.value))"
      min="0"
      max="1"
      step="0.01"
      aria-label="Visualisierungsintensität"
    />
  </div>
</template>

<script setup>
import { usePlayerStore } from './stores/playerStore'

const store = usePlayerStore()
</script>
