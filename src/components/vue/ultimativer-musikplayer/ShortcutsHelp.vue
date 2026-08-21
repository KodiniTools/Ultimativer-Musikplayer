<template>
  <Teleport to="body">
    <Transition name="shortcuts">
      <div
        v-if="visible"
        class="shortcuts-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="t('shortcuts.title')"
        @click.self="emit('close')"
      >
        <div class="shortcuts-modal">
          <div class="shortcuts-modal__header">
            <h2 class="shortcuts-modal__title">
              <i class="fa-solid fa-keyboard"></i>
              {{ t('shortcuts.title') }}
            </h2>
            <button
              type="button"
              class="shortcuts-modal__close"
              :aria-label="t('toast.dismiss')"
              @click="emit('close')"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <ul class="shortcuts-list">
            <li v-for="item in items" :key="item.label" class="shortcuts-list__row">
              <span class="shortcuts-list__label">{{ t(item.label) }}</span>
              <span class="shortcuts-list__keys">
                <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  defineProps({
    visible: { type: Boolean, default: false },
  })
  const emit = defineEmits(['close'])

  const items = [
    { label: 'shortcuts.playPause', keys: ['Space', 'K'] },
    { label: 'shortcuts.seek', keys: ['←', '→'] },
    { label: 'shortcuts.volume', keys: ['↑', '↓'] },
    { label: 'shortcuts.next', keys: ['N'] },
    { label: 'shortcuts.previous', keys: ['P'] },
    { label: 'shortcuts.mute', keys: ['M'] },
    { label: 'shortcuts.loop', keys: ['L'] },
    { label: 'shortcuts.shuffle', keys: ['S'] },
    { label: 'shortcuts.help', keys: ['?'] },
  ]
</script>

<style scoped>
  .shortcuts-overlay {
    position: fixed;
    inset: 0;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .shortcuts-modal {
    width: min(460px, 100%);
    max-height: 85vh;
    overflow-y: auto;
    border-radius: 16px;
    background: var(--bg-panel, #14263f);
    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.14));
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
    color: var(--text-primary, #f9f2d5);
  }

  .shortcuts-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border-primary, rgba(255, 255, 255, 0.12));
  }

  .shortcuts-modal__title {
    margin: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .shortcuts-modal__close {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    color: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }

  .shortcuts-modal__close:hover {
    background: color-mix(in srgb, currentColor 22%, transparent);
  }

  .shortcuts-list {
    list-style: none;
    margin: 0;
    padding: 8px 20px 20px;
  }

  .shortcuts-list__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  }

  .shortcuts-list__row:last-child {
    border-bottom: none;
  }

  .shortcuts-list__label {
    font-size: 0.9rem;
  }

  .shortcuts-list__keys {
    display: inline-flex;
    gap: 6px;
    flex-shrink: 0;
  }

  kbd {
    min-width: 24px;
    padding: 3px 8px;
    text-align: center;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 6px;
    background: color-mix(in srgb, currentColor 14%, transparent);
    border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
    box-shadow: 0 1px 0 color-mix(in srgb, currentColor 18%, transparent);
  }

  .shortcuts-enter-active,
  .shortcuts-leave-active {
    transition: opacity 0.2s ease;
  }

  .shortcuts-enter-active .shortcuts-modal,
  .shortcuts-leave-active .shortcuts-modal {
    transition: transform 0.2s ease;
  }

  .shortcuts-enter-from,
  .shortcuts-leave-to {
    opacity: 0;
  }

  .shortcuts-enter-from .shortcuts-modal,
  .shortcuts-leave-to .shortcuts-modal {
    transform: scale(0.95) translateY(10px);
  }

  @media (prefers-reduced-motion: reduce) {
    .shortcuts-enter-active,
    .shortcuts-leave-active,
    .shortcuts-enter-active .shortcuts-modal,
    .shortcuts-leave-active .shortcuts-modal {
      transition: none;
    }
  }
</style>
