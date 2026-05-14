/**
 * Database Module
 * Handles all Firestore CRUD operations.
 */

const DB = {
    // Fetch all notes for a specific user
    async fetchUserNotes(userId) {
        try {
            const snapshot = await db.collection('notes')
                .where('userId', '==', userId)
                .orderBy('updatedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching notes:", error);
            throw error;
        }
    },

    // Create a new note
    async createNote(userId) {
        const noteData = {
            userId: userId,
            title: 'Untitled Note',
            content: '',
            tags: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            sharePin: null,
            isPublic: false
        };

        try {
            const docRef = await db.collection('notes').add(noteData);
            return { id: docRef.id, ...noteData };
        } catch (error) {
            console.error("Error creating note:", error);
            throw error;
        }
    },

    // Update note content or metadata
    async updateNote(noteId, updates) {
        try {
            await db.collection('notes').doc(noteId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating note:", error);
            throw error;
        }
    },

    // Delete a note
    async deleteNote(noteId) {
        try {
            await db.collection('notes').doc(noteId).delete();
        } catch (error) {
            console.error("Error deleting note:", error);
            throw error;
        }
    },

    // Get a single note by ID (used for sharing)
    async getNoteById(noteId) {
        try {
            const doc = await db.collection('notes').doc(noteId).get();
            if (!doc.exists) throw new Error("Note not found");
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error("Error getting note:", error);
            throw error;
        }
    }
};
