import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'musikplayer.mutedToasts'
const MAX_VISIBLE = 4

function loadMuted() {
  try {
    if (typeof localStorage === 'undefined') return new Set()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveMuted(set) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch {
    /* storage unavailable — ignore */
  }
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  const muted = ref(loadMuted())

  let seq = 0
  const timers = new Map()

  // A stable identifier used both for de-duplication and for the
  // "don't show again" preference. Falls back to type + message so that
  // every toast is muteable even when no explicit key is provided.
  function effectiveKey(type, message, dismissKey) {
    return dismissKey || `${type}::${message}`
  }

  function isMuted(key) {
    return muted.value.has(key)
  }

  function remove(id) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function clearAll() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    toasts.value = []
  }

  /**
   * Show a toast.
   * @param {string} message
   * @param {{ type?: 'success'|'error'|'warning'|'info', duration?: number, dismissKey?: string }} [opts]
   * @returns {number|null} the toast id, or null if it was suppressed
   */
  function show(message, opts = {}) {
    if (!message) return null

    const type = opts.type || 'info'
    const duration = opts.duration ?? 4000
    const key = effectiveKey(type, message, opts.dismissKey)

    // Respect the user's "don't show again" choice.
    if (isMuted(key)) return null

    // De-duplicate: if the same toast is already visible, refresh its timer
    // instead of stacking an identical copy.
    const existing = toasts.value.find((t) => t.dismissKey === key)
    if (existing) {
      existing.message = message
      if (duration > 0) {
        const prev = timers.get(existing.id)
        if (prev) clearTimeout(prev)
        timers.set(
          existing.id,
          setTimeout(() => remove(existing.id), duration)
        )
      }
      return existing.id
    }

    const id = ++seq
    toasts.value.push({ id, message, type, dismissKey: key })

    // Cap the number of concurrently visible toasts (drop the oldest).
    while (toasts.value.length > MAX_VISIBLE) {
      remove(toasts.value[0].id)
    }

    if (duration > 0) {
      timers.set(
        id,
        setTimeout(() => remove(id), duration)
      )
    }

    return id
  }

  const success = (message, opts = {}) => show(message, { ...opts, type: 'success' })
  const error = (message, opts = {}) => show(message, { duration: 6000, ...opts, type: 'error' })
  const warning = (message, opts = {}) => show(message, { ...opts, type: 'warning' })
  const info = (message, opts = {}) => show(message, { ...opts, type: 'info' })

  /** Persistently suppress every future toast that shares this key. */
  function dismissForever(dismissKey) {
    if (!dismissKey) return
    muted.value.add(dismissKey)
    muted.value = new Set(muted.value)
    saveMuted(muted.value)
    // Remove any currently visible toasts that share the key.
    toasts.value.filter((t) => t.dismissKey === dismissKey).forEach((t) => remove(t.id))
  }

  /** Clear all "don't show again" preferences (toasts reappear). */
  function resetMuted() {
    muted.value = new Set()
    saveMuted(muted.value)
  }

  return {
    // State
    toasts,
    muted,
    // Core
    show,
    success,
    error,
    warning,
    info,
    remove,
    clearAll,
    // "Don't show again"
    isMuted,
    dismissForever,
    resetMuted,
  }
})
