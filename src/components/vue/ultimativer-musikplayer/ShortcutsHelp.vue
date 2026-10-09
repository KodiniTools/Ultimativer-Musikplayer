<template>
  <Teleport to="body">
    <Transition name="shortcuts">
      <div
        v-if="visible"
        class="shortcuts-overlay ds-app"
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
  /* Backdrop: Schwarz 50 %, kein Blur */
  .shortcuts-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--ds-z-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ds-space-5);
    background: rgba(0, 0, 0, 0.5);
  }

  /* Dialog size="lg": 720 px, hier auf 480 px begrenzt */
  .shortcuts-modal {
    position: relative;
    z-index: var(--ds-z-dialog);
    width: min(480px, 100%);
    max-height: 85vh;
    overflow-y: auto;
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface-1);
    color: var(--ds-text);
    box-shadow: var(--ds-shadow-overlay);
  }

  .shortcuts-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-3);
    padding: var(--ds-space-4) var(--ds-space-5);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  /* panel-title */
  .shortcuts-modal__title {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
  }

  .shortcuts-modal__title i {
    color: var(--ds-text-2);
    font-size: var(--ds-icon-sm);
  }

  /* IconButton ghost, Größe sm */
  .shortcuts-modal__close {
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--ds-radius-sm);
    background: transparent;
    color: var(--ds-text-2);
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  .shortcuts-modal__close:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  .shortcuts-list {
    list-style: none;
    margin: 0;
    padding: var(--ds-space-2) var(--ds-space-5) var(--ds-space-5);
  }

  .shortcuts-list__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-3);
    padding: var(--ds-space-2) 0;
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  .shortcuts-list__row:last-child {
    border-bottom: none;
  }

  .shortcuts-list__label {
    font-size: var(--ds-text-md);
  }

  .shortcuts-list__keys {
    display: inline-flex;
    gap: var(--ds-space-1);
    flex-shrink: 0;
  }

  /* Kbd: Tastenkappe mit 2-px-Unterkante */
  kbd {
    min-width: 24px;
    padding: 2px var(--ds-space-2);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-bottom-width: 2px;
    border-radius: var(--ds-radius-sm);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    font-family: inherit;
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    text-align: center;
  }

  /* Fade plus 8 px Hub von unten in --ds-duration-slow */
  .shortcuts-enter-active,
  .shortcuts-leave-active,
  .shortcuts-enter-active .shortcuts-modal,
  .shortcuts-leave-active .shortcuts-modal {
    transition:
      opacity var(--ds-duration-slow) var(--ds-ease),
      transform var(--ds-duration-slow) var(--ds-ease);
  }

  .shortcuts-enter-from,
  .shortcuts-leave-to {
    opacity: 0;
  }

  .shortcuts-enter-from .shortcuts-modal,
  .shortcuts-leave-to .shortcuts-modal {
    transform: translateY(8px);
  }
</style>
