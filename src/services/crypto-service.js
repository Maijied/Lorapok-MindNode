/**
 * Crypto Service
 * Implements industry-standard End-to-End Encryption (E2EE) using the Web Crypto API.
 */

const ITERATIONS = 100000;
const KEY_LEN = 256;

// In-memory cache for derived keys to avoid redundant PBKDF2 computations.
// Keys are cached based on the combination of password and salt.
const keyCache = new Map();

export const CryptoService = {
    async deriveKey(password, salt) {
        const saltB64 = salt instanceof Uint8Array ? this.bufferToBase64(salt) : salt;
        const cacheKey = `${password}:${saltB64}`;

        if (keyCache.has(cacheKey)) {
            return keyCache.get(cacheKey);
        }

        const encoder = new TextEncoder();
        const passwordKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const saltBuffer = salt instanceof Uint8Array ? salt : this.base64ToBuffer(salt);

        const derivedKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: ITERATIONS,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: KEY_LEN },
            false,
            ['encrypt', 'decrypt']
        );

        keyCache.set(cacheKey, derivedKey);
        return derivedKey;
    },

    async encrypt(plaintext, password, existingSalt = null) {
        const encoder = new TextEncoder();
        const salt = existingSalt ?
            (existingSalt instanceof Uint8Array ? existingSalt : this.base64ToBuffer(existingSalt)) :
            window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const key = await this.deriveKey(password, salt);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(plaintext)
        );

        return {
            ciphertext: this.bufferToBase64(encrypted),
            iv: this.bufferToBase64(iv),
            salt: this.bufferToBase64(salt)
        };
    },

    async decrypt(ciphertextB64, password, ivB64, saltB64) {
        const salt = this.base64ToBuffer(saltB64);
        const iv = this.base64ToBuffer(ivB64);
        const ciphertext = this.base64ToBuffer(ciphertextB64);

        const key = await this.deriveKey(password, salt);

        try {
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                ciphertext
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            throw new Error("Decryption failed: Invalid key or corrupted data.");
        }
    },

    /**
     * Encrypts a binary blob (for files).
     */
    async encryptBlob(blob, password) {
        const arrayBuffer = await blob.arrayBuffer();
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const key = await this.deriveKey(password, salt);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            arrayBuffer
        );

        return {
            ciphertext: this.bufferToBase64(encrypted),
            iv: this.bufferToBase64(iv),
            salt: this.bufferToBase64(salt)
        };
    },

    /**
     * Decrypts a binary blob (for files).
     */
    async decryptBlob(blob, password, ivB64, saltB64) {
        const arrayBuffer = await blob.arrayBuffer();
        const salt = this.base64ToBuffer(saltB64);
        const iv = this.base64ToBuffer(ivB64);

        const key = await this.deriveKey(password, salt);

        try {
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                arrayBuffer
            );
            return new Blob([decrypted]);
        } catch (e) {
            throw new Error("File decryption failed.");
        }
    },

    bufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    },

    base64ToBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
};
