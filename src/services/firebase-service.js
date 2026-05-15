import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export const DB = {
    async saveNote(noteId, payload) {
        // Save to Firestore
        const noteRef = doc(db, 'notes', noteId);
        await setDoc(noteRef, {
            ...payload,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update local cache for instant access
        await CacheService.setNote(noteId, payload);
    },

    async fetchNote(noteId) {
        // 1. Attempt to get from Local Cache first (Instant)
        const cached = await CacheService.getNote(noteId);
        if (cached) {
            console.log("[Cache] Note retrieved from local storage.");
            return cached;
        }

        // 2. Fallback to Firestore (Network)
        const noteRef = doc(db, 'notes', noteId);
        const snap = await getDoc(noteRef);
        if (!snap.exists()) throw new Error("Note not found");

        const data = snap.data();

        // 3. Update cache for next time
        await CacheService.setNote(noteId, data);

        return data;
    },

    async uploadFile(noteId, fileName, encryptedBlob) {
        const fileRef = ref(storage, `notes/${noteId}/${fileName}`);
        await uploadString(fileRef, encryptedBlob, 'base64');
        return await getDownloadURL(fileRef);
    },

    async deleteFile(fileUrl) {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
    },

    generateNoteId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
