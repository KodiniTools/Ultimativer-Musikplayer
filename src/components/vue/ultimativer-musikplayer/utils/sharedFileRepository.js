/**
 * Shared File Repository – IndexedDB bridge between KodiniTools apps.
 *
 * Normalizer writes normalised audio blobs here, the Playliste-Konverter
 * its finished playlist; the player reads from the same store when opened
 * with ?source=audionormalizer or ?source=playlistkonverter.
 */

import { openDB, transactionDone, requestResult } from './indexedDb'

const DB_NAME = 'kodinitools-shared-files'
const STORE_NAME = 'audio-files'
const DB_VERSION = 1

/** URL `source` values that hand files over through this store. */
export const SHARED_SOURCES = ['audionormalizer', 'playlistkonverter']

/**
 * Return the sharing tool named by the URL's `source` parameter, or null.
 * @param {string} search location.search
 * @returns {string | null}
 */
export function getSharedSource(search) {
  const source = new URLSearchParams(search).get('source')
  return SHARED_SOURCES.includes(source) ? source : null
}

/**
 * Return the URL without its `source` parameter (other params and hash stay),
 * so a reload restores the saved playlist instead of reading the store again.
 * @param {string} href location.href
 * @returns {string}
 */
export function withoutSourceParam(href) {
  const url = new URL(href)
  url.searchParams.delete('source')
  return url.pathname + url.search + url.hash
}

const openStore = () =>
  openDB(DB_NAME, DB_VERSION, STORE_NAME, { keyPath: 'id', autoIncrement: true })

export async function getSharedFiles() {
  const db = await openStore()
  const tx = db.transaction(STORE_NAME, 'readonly')
  return requestResult(db, tx.objectStore(STORE_NAME).getAll())
}

export async function clearSharedFiles() {
  const db = await openStore()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  return transactionDone(db, tx)
}
