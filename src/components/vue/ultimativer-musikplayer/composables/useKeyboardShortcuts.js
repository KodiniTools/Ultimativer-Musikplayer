import { onMounted, onUnmounted } from 'vue'

const SEEK_STEP = 5 // seconds
const VOLUME_STEP = 0.05

/**
 * Global keyboard shortcuts for the player. Ignores keystrokes while the
 * user is typing in a form field and leaves browser/OS combos (Ctrl/Cmd/
 * Alt) untouched.
 *
 * @param {object} store    the player store
 * @param {object} handlers { togglePlay, next, previous, stop, seekTo(pct),
 *                            setVolume(v), toggleMute, toggleLoop,
 *                            toggleShuffle, toggleHelp, closeHelp }
 */
export function useKeyboardShortcuts(store, handlers) {
  const isTypingTarget = (el) => {
    if (!el) return false
    const tag = el.tagName
    return (
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true
    )
  }

  const seekBy = (seconds) => {
    if (!store.duration) return
    const target = Math.min(Math.max(store.currentTime + seconds, 0), store.duration)
    handlers.seekTo((target / store.duration) * 100)
  }

  const changeVolume = (delta) => {
    const next = Math.min(Math.max(store.volume + delta, 0), 1)
    handlers.setVolume(next)
  }

  const onKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isTypingTarget(event.target)) return

    // "?" (Shift+/) toggles the help overlay; Escape closes it.
    if (event.key === '?') {
      event.preventDefault()
      handlers.toggleHelp()
      return
    }
    if (event.key === 'Escape') {
      handlers.closeHelp()
      return
    }

    switch (event.code) {
      case 'Space':
      case 'KeyK':
        event.preventDefault()
        handlers.togglePlay()
        break
      case 'ArrowRight':
        event.preventDefault()
        seekBy(SEEK_STEP)
        break
      case 'ArrowLeft':
        event.preventDefault()
        seekBy(-SEEK_STEP)
        break
      case 'ArrowUp':
        event.preventDefault()
        changeVolume(VOLUME_STEP)
        break
      case 'ArrowDown':
        event.preventDefault()
        changeVolume(-VOLUME_STEP)
        break
      case 'KeyN':
        handlers.next()
        break
      case 'KeyP':
        handlers.previous()
        break
      case 'KeyM':
        handlers.toggleMute()
        break
      case 'KeyL':
        handlers.toggleLoop()
        break
      case 'KeyS':
        handlers.toggleShuffle()
        break
      default:
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
