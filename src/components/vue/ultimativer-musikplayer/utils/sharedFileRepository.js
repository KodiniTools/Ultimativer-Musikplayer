/**
 * Shared File Repository – IndexedDB bridge between KodiniTools apps.
 *
 * Normalizer writes normalised audio blobs here; the player reads
 * from the same store when opened with ?source=audionormalizer.
 */

import { openDB, transactionDone, requestResult } from './indexedDb'

const DB_NAME = 'kodinitools-shared-files'
const STORE_NAME = 'audio-files'
const DB_VERSION = 1

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
