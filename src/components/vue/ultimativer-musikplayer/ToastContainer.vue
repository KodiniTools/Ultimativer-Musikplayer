<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="toast in store.toasts"
          :key="toast.id"
          class="toast"
          :class="'toast--' + toast.type"
          :role="toast.type === 'error' ? 'alert' : 'status'"
        >
          <span class="toast__icon" aria-hidden="true">
            <i v-if="toast.type === 'success'" class="fa-solid fa-circle-check"></i>
            <i v-else-if="toast.type === 'error'" class="fa-solid fa-triangle-exclamation"></i>
            <i v-else-if="toast.type === 'warning'" class="fa-solid fa-triangle-exclamation"></i>
            <i v-else class="fa-solid fa-circle-info"></i>
          </span>

          <div class="toast__body">
            <p class="toast__message">{{ toast.message }}</p>
            <button
              type="button"
              class="toast__dismiss-forever"
              @click="store.dismissForever(toast.dismissKey)"
            >
              {{ t('toast.dontShowAgain') }}
            </button>
          </div>

          <button
            type="button"
            class="toast__close"
            :aria-label="t('toast.dismiss')"
            :title="t('toast.dismiss')"
            @click="store.remove(toast.id)"
          >
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  import { useToastStore } from './stores/toastStore'

  const { t } = useI18n()
  const store = useToastStore()
</script>

<style scoped>
  .toast-container {
    position: fixed;
    bottom: 96px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    z-index: 10000;
    width: min(420px, calc(100vw - 24px));
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    line-height: 1.35;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .toast--success {
    background: rgba(46, 125, 50, 0.94);
  }

  .toast--error {
    background: rgba(198, 40, 40, 0.94);
  }

  .toast--warning {
    background: rgba(198, 132, 0, 0.94);
  }

  .toast--info {
    background: rgba(21, 101, 192, 0.94);
  }

  .toast__icon {
    flex-shrink: 0;
    font-size: 1.05rem;
    line-height: 1.35;
  }

  .toast__body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toast__message {
    margin: 0;
    word-break: break-word;
  }

  .toast__dismiss-forever {
    align-self: flex-start;
    padding: 0;
    border: none;
    background: none;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .toast__dismiss-forever:hover {
    color: #fff;
  }

  .toast__close {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .toast__close:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  /* Transitions */
  .toast-enter-active,
  .toast-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .toast-enter-from {
    opacity: 0;
    transform: translateY(16px);
  }

  .toast-leave-to {
    opacity: 0;
    transform: translateY(12px);
  }

  .toast-leave-active {
    position: absolute;
    width: 100%;
  }

  .toast-move {
    transition: transform 0.25s ease;
  }

  @media (max-width: 600px) {
    .toast-container {
      bottom: 88px;
    }
  }
</style>
