/**
 * Cache Service
 * Provides high-performance local storage using IndexedDB.
 */

const DB_NAME = 'mindnode-cache';
const STORE_NAME = 'notes-cache';
const DB_VERSION = 3; // Bumped version to ensure onupgradeneeded runs

export const CacheService = {
    async setNote(noteId, data) {
        const db = await this._getDB();
        const existing = await this.getNote(noteId);
        const mergedData = { ...existing, ...data, id: noteId, cachedAt: new Date().toISOString() };

        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.put(mergedData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (err) { reject(err); }
        });
    },

    async getNote(noteId) {
        const db = await this._getDB();
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(noteId);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => resolve(null);
            } catch (err) { resolve(null); }
        });
    },

    async deleteNote(noteId) {
        const db = await this._getDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.delete(noteId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (err) { reject(err); }
        });
    },

    async clearCache() {
        const db = await this._getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
    },

    _dbPromise: null,
    async _getDB() {
        if (this._dbPromise) return this._dbPromise;
        this._dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => { this._dbPromise = null; reject(e.target.error); };
        });
        return this._dbPromise;
    }
};
