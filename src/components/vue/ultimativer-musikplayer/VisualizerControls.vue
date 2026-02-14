<template>
  <div class="viz-controls" aria-label="Visualizer Einstellungen">
    <label class="field">
      <span>{{ t('player.mode') }}</span>
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
      </select>
    </label>
    <label class="field">
      <span>{{ t('player.intensity') }}</span>
      <input 
        type="range" 
        :value="store.vizIntensity"
        @input="store.setVizIntensity(parseFloat($event.target.value))"
        min="0" 
        max="1" 
        step="0.01" 
        aria-label="Visualisierungsintensität" 
      />
    </label>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from './stores/playerStore'

const { t } = useI18n()
const store = usePlayerStore()
</script>
