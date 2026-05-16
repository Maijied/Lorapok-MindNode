/**
 * Cache Service
 * Provides high-performance local storage using IndexedDB.
 *
 * Purpose: To ensure the app feels instantaneous and works offline (once loaded),
 * storing the encrypted blobs so we don't hit Firestore for every note read.
 */

const DB_NAME = 'mindnode-cache';
const STORE_NAME = 'notes-cache';

export const CacheService = {
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(false);
        });
    },

    async setNote(noteId, data) {
        const db = await this._getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: noteId, ...data, cachedAt: new Date().toISOString() });
    },

    async getNote(noteId) {
        const db = await this._getDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(noteId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    },

    async clearCache() {
        const db = await this._getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
    },

    async _getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(false);
        });
    }
};
