import { watch } from 'vue'
import {
  savePlaylist,
  loadPlaylist,
  clearPersistedPlaylist,
  saveSettings,
  loadSettings,
} from '../utils/playlistRepository'

/**
 * Persists the playlist (IndexedDB) and playback settings (localStorage)
 * and restores them on the next visit.
 *
 * `restore()` returns the saved File objects (if any) so the caller can
 * feed them into the audio pipeline; settings are applied to the store
 * directly.
 */
export function usePersistence(store) {
  let playlistTimer = null

  function persistPlaylistSoon() {
    clearTimeout(playlistTimer)
    playlistTimer = setTimeout(() => {
      if (store.audioFiles.length === 0) {
        clearPersistedPlaylist().catch(() => {})
      } else {
        savePlaylist(store.audioFiles).catch(() => {})
      }
    }, 400)
  }

  function persistSettings() {
    saveSettings({
      currentAudioIndex: store.currentAudioIndex,
      volume: store.volume,
      loopPlaylist: store.loopPlaylist,
      shufflePlaylist: store.shufflePlaylist,
      vizMode: store.vizMode,
      vizIntensity: store.vizIntensity,
    })
  }

  function startWatching() {
    // Re-persist the playlist whenever its length or contents change.
    watch(() => store.audioFiles.map((f) => `${f.name}:${f.size}`).join('|'), persistPlaylistSoon)
    // Re-persist settings on any relevant change.
    watch(
      () => [
        store.currentAudioIndex,
        store.volume,
        store.loopPlaylist,
        store.shufflePlaylist,
        store.vizMode,
        store.vizIntensity,
      ],
      persistSettings
    )
  }

  async function restore() {
    const settings = loadSettings()
    if (settings) {
      if (typeof settings.volume === 'number') store.setVolume(settings.volume)
      if (typeof settings.loopPlaylist === 'boolean') store.loopPlaylist = settings.loopPlaylist
      if (typeof settings.shufflePlaylist === 'boolean')
        store.shufflePlaylist = settings.shufflePlaylist
      if (typeof settings.vizMode === 'string') store.setVizMode(settings.vizMode)
      if (typeof settings.vizIntensity === 'number') store.setVizIntensity(settings.vizIntensity)
    }

    let files
    try {
      files = await loadPlaylist()
    } catch {
      files = []
    }

    const savedIndex =
      settings && Number.isInteger(settings.currentAudioIndex) ? settings.currentAudioIndex : 0

    return { files, savedIndex }
  }

  return { restore, startWatching }
}
