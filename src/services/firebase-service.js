import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { CacheService } from './cache-service';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app, db, storage;
let isFirebaseEnabled = false;

try {
    // Firebase config is only valid if the API Key is present
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        storage = getStorage(app);
        isFirebaseEnabled = true;
        console.log("[DB] Firebase initialized successfully.");
    } else {
        console.warn("[DB] Firebase config missing. App running in Local-Only mode.");
    }
} catch (err) {
    console.error("[DB] Firebase initialization failed:", err);
    isFirebaseEnabled = false;
}

export const DB = {
    async saveNote(noteId, payload) {
        // Always save to Local Cache first (Local-First)
        await CacheService.setNote(noteId, payload);

        if (!isFirebaseEnabled) return;

        try {
            const noteRef = doc(db, 'notes', noteId);
            // We use setDoc with merge: true to avoid overwriting existing fields
            // if the payload only contains a subset of fields.
            await setDoc(noteRef, {
                ...payload,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (err) {
            console.error("[DB] Cloud sync failed:", err);
        }
    },

    async getNoteMeta(noteId) {
        let data = null;
        try {
            data = await CacheService.getNote(noteId);
        } catch {
            data = null;
        }

        if (!data?.ciphertext && isFirebaseEnabled) {
            try {
                const noteRef = doc(db, 'notes', noteId);
                const snap = await getDoc(noteRef);
                if (snap.exists()) {
                    data = snap.data();
                    // Cache it for future use
                    await CacheService.setNote(noteId, data);
                }
            } catch {
                data = null;
            }
        }

        if (!data?.ciphertext) {
            return { exists: false, pinEnabled: false };
        }

        return { exists: true, pinEnabled: !!data.pinEnabled };
    },

    async fetchNote(noteId) {
        // 1. Attempt to get from Local Cache first (Instant)
        const cached = await CacheService.getNote(noteId);
        if (cached && cached.ciphertext) {
            return cached;
        }

        if (!isFirebaseEnabled) {
            if (cached) return cached; // Might have partial data?
            throw new Error("Note not found in local storage and Cloud Sync is disabled.");
        }

        try {
            const noteRef = doc(db, 'notes', noteId);
            const snap = await getDoc(noteRef);
            if (!snap.exists()) throw new Error("Note not found");

            const data = snap.data();
            await CacheService.setNote(noteId, data);
            return data;
        } catch (err) {
            console.error("[DB] Cloud fetch failed:", err);
            throw err;
        }
    },

    async uploadFile(noteId, fileName, encryptedBlob) {
        if (!isFirebaseEnabled) {
            throw new Error("Cloud storage is required for file attachments. Please configure Firebase.");
        }
        const fileRef = ref(storage, `notes/${noteId}/${fileName}`);
        await uploadString(fileRef, encryptedBlob, 'base64');
        return await getDownloadURL(fileRef);
    },

    async deleteFile(fileUrl) {
        if (!isFirebaseEnabled) return;
        try {
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);
        } catch (err) {
            console.error("[DB] File deletion failed:", err);
        }
    },

    generateNoteId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
