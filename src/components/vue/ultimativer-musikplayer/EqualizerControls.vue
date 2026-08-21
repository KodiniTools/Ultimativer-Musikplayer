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
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.14));
    border-radius: 12px;
    background: var(--bg-surface, rgba(255, 255, 255, 0.05));
    overflow: hidden;
  }

  .eq__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
  }

  .eq__toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: none;
    color: var(--text-primary, inherit);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
  }

  .eq__chevron {
    font-size: 0.7rem;
    opacity: 0.6;
    transition: transform 0.2s ease;
  }

  .eq__chevron--up {
    transform: rotate(180deg);
  }

  /* Toggle switch */
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
    width: 38px;
    height: 22px;
    border-radius: 22px;
    background: color-mix(in srgb, currentColor 25%, transparent);
    transition: background 0.2s ease;
    display: inline-flex;
    align-items: center;
    padding: 2px;
  }

  .eq__switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
  }

  .eq__switch input:checked + .eq__switch-track {
    background: var(--accent, #7c6af7);
  }

  .eq__switch input:checked + .eq__switch-track .eq__switch-thumb {
    transform: translateX(16px);
  }

  .eq__body {
    padding: 6px 14px 16px;
    transition: opacity 0.2s ease;
  }

  .eq__body--disabled {
    opacity: 0.45;
  }

  .eq__row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .eq__preset {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .eq__preset select {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.16));
    background: var(--bg-elevated, rgba(255, 255, 255, 0.08));
    color: var(--text-primary, inherit);
    font-size: 0.85rem;
    cursor: pointer;
  }

  .eq__reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.16));
    background: none;
    color: var(--text-primary, inherit);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .eq__reset:hover {
    background: color-mix(in srgb, currentColor 10%, transparent);
  }

  .eq__bands {
    display: flex;
    justify-content: space-between;
    gap: 4px;
  }

  .eq__band {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .eq__gain {
    font-size: 0.68rem;
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }

  .eq__freq {
    font-size: 0.68rem;
    opacity: 0.6;
  }

  /* Vertical slider */
  .eq__slider {
    -webkit-appearance: slider-vertical;
    appearance: slider-vertical;
    writing-mode: vertical-lr;
    direction: rtl;
    width: 6px;
    height: 96px;
    accent-color: var(--accent, #7c6af7);
    cursor: pointer;
  }

  @media (max-width: 600px) {
    .eq__slider {
      height: 78px;
    }
    .eq__gain,
    .eq__freq {
      font-size: 0.6rem;
    }
  }
</style>
