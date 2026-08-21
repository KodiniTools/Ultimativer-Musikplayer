import { watch } from 'vue'

/**
 * Bridges the player to the OS Media Session API so that lock-screen
 * controls, media keys and headset buttons work.
 *
 * @param {object} store    the player store
 * @param {object} handlers { play, pause, stop, next, previous, seek(percentage) }
 */
export function useMediaSession(store, handlers) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return
  }

  const ms = navigator.mediaSession

  const setActions = () => {
    const safe = (fn) => () => {
      try {
        fn()
      } catch {
        /* ignore */
      }
    }
    try {
      ms.setActionHandler('play', safe(handlers.play))
      ms.setActionHandler('pause', safe(handlers.pause))
      ms.setActionHandler('stop', safe(handlers.stop))
      ms.setActionHandler('previoustrack', safe(handlers.previous))
      ms.setActionHandler('nexttrack', safe(handlers.next))
      ms.setActionHandler('seekto', (details) => {
        if (details.seekTime != null && store.duration) {
          handlers.seek((details.seekTime / store.duration) * 100)
        }
      })
    } catch {
      /* some browsers reject unsupported actions — ignore */
    }
  }

  const updateMetadata = () => {
    const file = store.currentFile
    if (!file || !window.MediaMetadata) {
      ms.metadata = null
      return
    }
    const meta = file.metadata || {}
    const title = meta.title || file.name.replace(/\.[^.]+$/, '')
    const artwork = meta.coverUrl
      ? [{ src: meta.coverUrl, sizes: '512x512', type: meta.coverType || 'image/jpeg' }]
      : []

    ms.metadata = new window.MediaMetadata({
      title,
      artist: meta.artist || 'Ultimativer Musikplayer',
      album: meta.album || '',
      artwork,
    })
  }

  const updatePlaybackState = () => {
    ms.playbackState = store.isPlaying ? 'playing' : 'paused'
  }

  setActions()

  watch(() => store.currentFile, updateMetadata, { immediate: true })
  watch(() => store.currentFile?.metadata, updateMetadata)
  watch(() => store.isPlaying, updatePlaybackState, { immediate: true })
}
