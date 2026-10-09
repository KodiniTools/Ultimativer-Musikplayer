<template>
  <div class="eq" :class="{ 'eq--open': expanded }">
    <div class="eq__header">
      <button
        type="button"
        class="eq__toggle"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <i class="fa-solid fa-sliders"></i>
        <span>{{ t('equalizer.title') }}</span>
        <i
          class="fa-solid fa-chevron-down eq__chevron"
          :class="{ 'eq__chevron--up': expanded }"
        ></i>
      </button>

      <label class="eq__switch" :title="t('equalizer.enable')">
        <input
          type="checkbox"
          :checked="store.eqEnabled"
          @change="store.setEqEnabled($event.target.checked)"
        />
        <span class="eq__switch-track"><span class="eq__switch-thumb"></span></span>
      </label>
    </div>

    <div v-show="expanded" class="eq__body" :class="{ 'eq__body--disabled': !store.eqEnabled }">
      <div class="eq__row">
        <label class="eq__preset">
          <span>{{ t('equalizer.preset') }}</span>
          <select :value="store.eqPreset" @change="onPresetChange($event.target.value)">
            <option v-for="name in presetOrder" :key="name" :value="name">
              {{ t('equalizer.presets.' + name) }}
            </option>
            <option v-if="store.eqPreset === 'custom'" value="custom">
              {{ t('equalizer.presets.custom') }}
            </option>
          </select>
        </label>
        <button type="button" class="eq__reset" @click="store.applyEqPreset('flat')">
          <i class="fa-solid fa-rotate-left"></i>
          {{ t('equalizer.reset') }}
        </button>
      </div>

      <div class="eq__bands">
        <div v-for="(freq, i) in frequencies" :key="freq" class="eq__band">
          <span class="eq__gain">{{ formatGain(store.eqBands[i]) }}</span>
          <input
            class="eq__slider"
            type="range"
            :min="minDb"
            :max="maxDb"
            step="1"
            :value="store.eqBands[i]"
            :aria-label="formatFrequency(freq) + ' Hz'"
            @input="store.setEqBand(i, Number($event.target.value))"
          />
          <span class="eq__freq">{{ formatFrequency(freq) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { usePlayerStore } from './stores/playerStore'
  import {
    EQ_FREQUENCIES,
    EQ_PRESET_ORDER,
    EQ_MIN_DB,
    EQ_MAX_DB,
    formatFrequency,
  } from './utils/equalizerPresets'

  const { t } = useI18n()
  const store = usePlayerStore()

  const expanded = ref(false)
  const frequencies = EQ_FREQUENCIES
  const presetOrder = EQ_PRESET_ORDER
  const minDb = EQ_MIN_DB
  const maxDb = EQ_MAX_DB

  const formatGain = (db) => `${db > 0 ? '+' : ''}${db}`

  const onPresetChange = (name) => {
    if (name === 'custom') return
    store.applyEqPreset(name)
    if (!store.eqEnabled) store.setEqEnabled(true)
  }
</script>

<style scoped>
  .eq {
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-1);
    overflow: hidden;
  }

  .eq__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-3);
    padding: var(--ds-space-1) var(--ds-space-3);
  }

  .eq__toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    min-height: var(--ds-control-md);
    padding: 0 var(--ds-space-2);
    margin-left: calc(-1 * var(--ds-space-2));
    border: none;
    border-radius: var(--ds-radius-sm);
    background: none;
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    cursor: pointer;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .eq__toggle:hover {
    background: var(--ds-surface-3);
  }

  .eq__toggle > i:first-child {
    color: var(--ds-text-2);
  }

  .eq__chevron {
    color: var(--ds-text-2);
    font-size: var(--ds-text-xs);
    transition: transform var(--ds-duration) var(--ds-ease);
  }

  .eq__chevron--up {
    transform: rotate(180deg);
  }

  /* Umschalter: „an“ ist primär (Akzentfläche) */
  .eq__switch {
    position: relative;
    display: inline-flex;
    cursor: pointer;
  }

  .eq__switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .eq__switch-track {
    display: inline-flex;
    align-items: center;
    width: 38px;
    height: 22px;
    padding: 2px;
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-full);
    background: var(--ds-surface-2);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
  }

  .eq__switch-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--ds-text-2);
    transition:
      transform var(--ds-duration) var(--ds-ease),
      background-color var(--ds-duration) var(--ds-ease);
  }

  .eq__switch input:checked + .eq__switch-track {
    border-color: var(--ds-accent);
    background: var(--ds-accent);
  }

  .eq__switch input:checked + .eq__switch-track .eq__switch-thumb {
    background: var(--ds-on-accent);
    transform: translateX(16px);
  }

  .eq__switch input:focus-visible + .eq__switch-track {
    box-shadow: var(--ds-focus-ring);
  }

  .eq__body {
    padding: var(--ds-space-2) var(--ds-space-4) var(--ds-space-4);
    border-top: var(--ds-border-width) solid var(--ds-border);
    transition: opacity var(--ds-duration) var(--ds-ease);
  }

  .eq__body--disabled {
    opacity: 0.45;
  }

  .eq__row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--ds-space-3);
    margin-bottom: var(--ds-space-4);
  }

  /* label über dem Select */
  .eq__preset {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
  }

  .eq__preset select {
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-3);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
  }

  .eq__preset select:hover {
    background: var(--ds-surface-3);
  }

  .eq__preset select:focus-visible {
    border-color: var(--ds-accent);
  }

  /* Button secondary, Größe sm */
  .eq__reset {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-sm);
    padding: 0 var(--ds-space-3);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    cursor: pointer;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .eq__reset:hover {
    background: var(--ds-surface-3);
  }

  .eq__reset i {
    color: var(--ds-text-2);
  }

  .eq__bands {
    display: flex;
    justify-content: space-between;
    gap: var(--ds-space-1);
  }

  .eq__band {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ds-space-2);
  }

  .eq__gain,
  .eq__freq {
    font-size: var(--ds-text-xs);
    font-variant-numeric: tabular-nums;
  }

  .eq__gain {
    color: var(--ds-text);
  }

  .eq__freq {
    color: var(--ds-text-2);
  }

  /* Vertikaler Regler: nativ, Akzent als Füllfarbe */
  .eq__slider {
    -webkit-appearance: slider-vertical;
    appearance: slider-vertical;
    writing-mode: vertical-lr;
    direction: rtl;
    width: 6px;
    height: 96px;
    accent-color: var(--ds-accent);
    cursor: pointer;
  }

  @media (max-width: 600px) {
    .eq__slider {
      height: 78px;
    }
  }
</style>
