<template>
  <Teleport to="body">
    <div class="toast-container ds-app" aria-live="polite" aria-atomic="false">
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
            <i
              v-else-if="toast.type === 'error' || toast.type === 'warning'"
              class="fa-solid fa-triangle-exclamation"
            ></i>
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
    z-index: var(--ds-z-toast);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ds-space-2);
    width: min(420px, calc(100vw - 24px));
    pointer-events: none;
  }

  /* Toast: Panel-Fläche, Overlay-Schatten, Status nur als Icon und 3-px-Linie */
  .toast {
    --toast-status: var(--ds-info);
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: var(--ds-space-3);
    width: 100%;
    padding: var(--ds-space-3);
    border: var(--ds-border-width) solid var(--ds-border);
    border-left: 3px solid var(--toast-status);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-1);
    color: var(--ds-text);
    font-size: var(--ds-text-sm);
    line-height: var(--ds-leading);
    box-shadow: var(--ds-shadow-overlay);
  }

  .toast--success {
    --toast-status: var(--ds-success);
  }

  .toast--error {
    --toast-status: var(--ds-danger);
  }

  .toast--warning {
    --toast-status: var(--ds-warning);
  }

  .toast--info {
    --toast-status: var(--ds-info);
  }

  .toast__icon {
    flex-shrink: 0;
    color: var(--toast-status);
    font-size: var(--ds-icon-sm);
    line-height: var(--ds-leading);
  }

  .toast__body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
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
    color: var(--ds-link);
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    transition: color var(--ds-duration) var(--ds-ease);
  }

  .toast__dismiss-forever:hover {
    color: var(--ds-accent);
  }

  /* IconButton ghost, Größe sm */
  .toast__close {
    flex-shrink: 0;
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: calc(-1 * var(--ds-space-1)) calc(-1 * var(--ds-space-1)) 0 0;
    border: none;
    border-radius: var(--ds-radius-sm);
    background: transparent;
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  .toast__close:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  /* Fade plus 16 px Hub in --ds-duration-slow */
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition:
      opacity var(--ds-duration-slow) var(--ds-ease),
      transform var(--ds-duration-slow) var(--ds-ease);
  }

  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translateY(16px);
  }

  .toast-leave-active {
    position: absolute;
    width: 100%;
  }

  @media (max-width: 600px) {
    .toast-container {
      bottom: 88px;
    }
  }
</style>
