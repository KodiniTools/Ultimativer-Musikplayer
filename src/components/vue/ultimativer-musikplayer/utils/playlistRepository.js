/**
 * Playlist Repository – persists the user's own playlist across reloads.
 *
 * Audio files (Blobs) are stored in IndexedDB; lightweight playback
 * settings (volume, current index, loop/shuffle, visualizer) live in
 * localStorage. Everything stays local on the device.
 */

import { openDB, transactionDone, requestResult } from './indexedDb'

const DB_NAME = 'kodinitools-musikplayer'
const STORE_NAME = 'playlist'
const DB_VERSION = 1
const SETTINGS_KEY = 'musikplayer.settings'

const openStore = () => openDB(DB_NAME, DB_VERSION, STORE_NAME, { keyPath: 'order' })

/** Replace the persisted playlist with the given File objects (in order). */
export async function savePlaylist(files) {
  const db = await openStore()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.clear()
  Array.from(files).forEach((file, index) => {
    store.put({
      order: index,
      name: file.name,
      mimeType: file.type || '',
      blob: file,
    })
  })
  return transactionDone(db, tx)
}

/** Load the persisted playlist as an ordered array of File objects. */
export async function loadPlaylist() {
  const db = await openStore()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const result = await requestResult(db, tx.objectStore(STORE_NAME).getAll())
  const records = (result || []).sort((a, b) => a.order - b.order)
  return records.map((r) => {
    if (r.blob instanceof File) return r.blob
    return new File([r.blob], r.name, { type: r.mimeType || r.blob?.type || '' })
  })
}

/** Remove the entire persisted playlist. */
export async function clearPersistedPlaylist() {
  const db = await openStore()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  return transactionDone(db, tx)
}

/** Persist lightweight playback settings. */
export function saveSettings(settings) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Load persisted playback settings (or null). */
export function loadSettings() {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
