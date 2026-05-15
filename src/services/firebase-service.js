import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// In a real Vite app, these are loaded from import.meta.env
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

export const DB = {
    /**
     * Save an encrypted note.
     * Note: We only save the encrypted payload.
     */
    async saveNote(noteId, encryptedPayload) {
        const noteRef = doc(db, 'notes', noteId);
        await setDoc(noteRef, {
            ...encryptedPayload,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    },

    /**
     * Fetch an encrypted note.
     */
    async fetchNote(noteId) {
        const noteRef = doc(db, 'notes', noteId);
        const snap = await getDoc(noteRef);
        if (!snap.exists()) throw new Error("Note not found");
        return snap.data();
    },

    /**
     * Generates a random Note ID for new notes.
     */
    generateNoteId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};
