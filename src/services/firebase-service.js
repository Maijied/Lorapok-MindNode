import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        storage = getStorage(app);
        isFirebaseEnabled = true;
    }
} catch (err) { isFirebaseEnabled = false; }

export const DB = {
    async saveNote(noteId, payload) {
        await CacheService.setNote(noteId, payload);
        if (!isFirebaseEnabled) return;
        try {
            const noteRef = doc(db, 'notes', noteId);
            await setDoc(noteRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (err) { console.error("Cloud sync failed", err); }
    },

    async deleteNote(noteId, attachments = []) {
        await CacheService.deleteNote(noteId);
        if (!isFirebaseEnabled) return;
        try {
            for (const file of attachments) {
                try { await deleteObject(ref(storage, file.url)); } catch (e) {}
            }
            await deleteDoc(doc(db, 'notes', noteId));
        } catch (err) { console.error("Cloud deletion failed", err); throw err; }
    },

    async getNoteMeta(noteId) {
        let data = await CacheService.getNote(noteId);
        if (!data?.ciphertext && isFirebaseEnabled) {
            try {
                const snap = await getDoc(doc(db, 'notes', noteId));
                if (snap.exists()) { data = snap.data(); await CacheService.setNote(noteId, data); }
            } catch (err) {}
        }
        if (!data?.ciphertext) return { exists: false, pinEnabled: false };
        return { exists: true, pinEnabled: !!data.pinEnabled };
    },

    async fetchNote(noteId) {
        const cached = await CacheService.getNote(noteId);
        if (cached && cached.ciphertext) return cached;
        if (!isFirebaseEnabled) { if (cached) return cached; throw new Error("Note not found"); }
        try {
            const snap = await getDoc(doc(db, 'notes', noteId));
            if (!snap.exists()) throw new Error("Note not found");
            const data = snap.data(); await CacheService.setNote(noteId, data); return data;
        } catch (err) { throw err; }
    },

    async uploadFile(noteId, fileName, encryptedBlob) {
        if (!isFirebaseEnabled) throw new Error("Cloud storage required");
        const fileRef = ref(storage, `notes/${noteId}/${fileName}`);
        await uploadString(fileRef, encryptedBlob, 'base64');
        return await getDownloadURL(fileRef);
    },

    async deleteFile(fileUrl) {
        if (!isFirebaseEnabled) return;
        try { await deleteObject(ref(storage, fileUrl)); } catch (err) {}
    },

    generateNoteId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
