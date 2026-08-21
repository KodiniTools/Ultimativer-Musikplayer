import { watch } from 'vue'
import { parseMetadata, fileKey } from '../utils/audioMetadata'

/**
 * Parses ID3/FLAC metadata (title/artist/album/cover) for every track in
 * the playlist and stores the result in the player store, keyed by
 * fileKey. Cover images become object URLs for display.
 */
export function useMetadata(store) {
  const pending = new Set()

  async function process(file) {
    const key = fileKey(file)
    if (pending.has(key) || store.trackMeta[key]) return
    pending.add(key)
    try {
      const meta = await parseMetadata(file)
      const coverUrl = meta.coverBlob ? URL.createObjectURL(meta.coverBlob) : ''
      store.setTrackMeta(key, {
        title: meta.title || '',
        artist: meta.artist || '',
        album: meta.album || '',
        coverUrl,
        coverType: meta.coverType || '',
      })
    } catch {
      store.setTrackMeta(key, { title: '', artist: '', album: '', coverUrl: '', coverType: '' })
    } finally {
      pending.delete(key)
    }
  }

  function processAll() {
    store.audioFiles.forEach((file) => process(file))
  }

  watch(() => store.audioFiles.length, processAll, { immediate: true })
}
