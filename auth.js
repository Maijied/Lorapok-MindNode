/**
 * Authentication Module
 * Handles all identity operations.
 */

const Auth = {
    async signUp(email, password) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    },

    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        try {
            await auth.signOut();
        } catch (error) {
            throw error;
        }
    },

    getCurrentUser() {
        return auth.currentUser;
    },

    onAuthStateChanged(callback) {
        auth.onAuthStateChanged(callback);
    }
};
