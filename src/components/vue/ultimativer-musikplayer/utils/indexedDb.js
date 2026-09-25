/**
 * Minimal promise helpers around IndexedDB, shared by the repositories.
 */

/**
 * Open (and create on first use) a database with a single object store.
 * @param {string} dbName
 * @param {number} version
 * @param {string} storeName
 * @param {IDBObjectStoreParameters} storeOptions
 * @returns {Promise<IDBDatabase>}
 */
export function openDB(dbName, version, storeName, storeOptions) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, storeOptions)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Resolve when the transaction completes; closes the database either way. */
export function transactionDone(db, tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

/** Resolve with the request's result; closes the database either way. */
export function requestResult(db, request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}
