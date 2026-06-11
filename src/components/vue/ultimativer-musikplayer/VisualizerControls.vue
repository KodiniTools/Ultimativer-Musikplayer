<template>
  <div class="viz-controls" aria-label="Visualizer Einstellungen">
    <select
      :value="store.vizMode"
      aria-label="Visualisierungsmodus"
      @change="store.setVizMode($event.target.value)"
    >
      <option value="ribbon">Mirror Bars</option>
      <option value="waves">Liquid Wave</option>
      <option value="nebula">Plasma</option>
      <option value="spectrum">Arc Spectrum</option>
      <option value="orbits">DNA Helix</option>
      <option value="starfield">Warp Tunnel</option>
      <option value="grid">LED Equalizer</option>
      <option value="aurora">Aurora</option>
      <option value="kaleidoscope">Mandala</option>
      <option value="particles">Sparks</option>
    </select>
    <input
      type="range"
      class="viz-slider"
      :value="store.vizIntensity"
      min="0"
      max="1"
      step="0.01"
      aria-label="Visualisierungsintensität"
      @input="store.setVizIntensity(parseFloat($event.target.value))"
    />
  </div>
</template>

<script setup>
import { usePlayerStore } from './stores/playerStore'

const store = usePlayerStore()
</script>
