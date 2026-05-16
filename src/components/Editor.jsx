import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Share2, Trash2, Download, Upload, Eye, EyeOff, AlertCircle, Clock, Tag, X, FileText, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CryptoService } from '../services/crypto-service';
import { MnemonicService, isValidPin } from '../services/mnemonic-service';
import { DB } from '../services/firebase-service';
import { useVault } from '../hooks/useVault';
import MarkdownPreview from './MarkdownPreview';

const Editor = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const { addNoteToVault } = useVault();

    const [key, setKey] = useState('');
    const [unlockMode, setUnlockMode] = useState('pin');
    const [isNewNote, setIsNewNote] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [setupPin, setSetupPin] = useState('');
    const [setupPinConfirm, setSetupPinConfirm] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('Untitled Note');
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [ttl, setTtl] = useState('0');
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    const autoSaveTimer = useRef(null);
    const fileInputRef = useRef(null);

    const getFinalKey = (mode, input) =>
        mode === 'recovery' ? MnemonicService.phraseToKey(input) : input;

    useEffect(() => {
        DB.getNoteMeta(noteId).then(({ exists, pinEnabled: hasPin }) => {
            setIsNewNote(!exists);
            setPinEnabled(hasPin);
            setUnlockMode(!exists || !hasPin ? 'recovery' : 'pin');
        });
    }, [noteId]);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setError('');

        if (isNewNote && unlockMode !== 'recovery') {
            setError('New notes must be set up with a recovery phrase first.');
            return;
        }

        if (unlockMode === 'recovery') {
            if (!MnemonicService.validatePhrase(key)) {
                setError('Enter a valid 12-word recovery phrase.');
                return;
            }
        } else if (!isValidPin(key)) {
            setError('Enter a 6-digit PIN.');
            return;
        }

        if (isNewNote) {
            setShowPinSetup(true);
            return;
        }

        try {
            const data = await DB.fetchNote(noteId);
            let decryptKey = getFinalKey(unlockMode, key);

            if (unlockMode === 'recovery' && data.pinEnabled && data.recoverySeal) {
                const recoveredPin = await CryptoService.decrypt(
                    data.recoverySeal.ciphertext,
                    decryptKey,
                    data.recoverySeal.iv,
                    data.recoverySeal.salt
                );
                decryptKey = recoveredPin;
                setUnlockMode('pin');
                setKey(recoveredPin);
            }

            const decryptedText = await CryptoService.decrypt(
                data.ciphertext,
                decryptKey,
                data.iv,
                data.salt
            );

            let finalTitle = title;
            if (data.encryptedTitle) {
                finalTitle = await CryptoService.decrypt(data.encryptedTitle.ciphertext, decryptKey, data.encryptedTitle.iv, data.encryptedTitle.salt);
            }

            let finalTags = [];
            if (data.encryptedTags) {
                const decryptedTagsRaw = await CryptoService.decrypt(data.encryptedTags.ciphertext, decryptKey, data.encryptedTags.iv, data.encryptedTags.salt);
                finalTags = JSON.parse(decryptedTagsRaw);
            }

            setContent(decryptedText);
            setTitle(finalTitle);
            setTags(finalTags);
            setAttachments(data.attachments || []);
            setIsDecrypted(true);
            addNoteToVault(noteId, finalTitle);
        } catch (err) {
            setError(unlockMode === 'recovery'
                ? 'Invalid recovery phrase.'
                : 'Invalid 6-digit PIN. Try recovery phrase if you forgot your PIN.');
        }
    };

    const handlePinSetup = async (e) => {
        e.preventDefault();
        setError('');
        if (!isValidPin(setupPin)) {
            setError('PIN must be exactly 6 digits.');
            return;
        }
        if (setupPin !== setupPinConfirm) {
            setError('PINs do not match.');
            return;
        }

        try {
            const recoveryKey = getFinalKey('recovery', key);
            const recoverySeal = await CryptoService.encrypt(setupPin, recoveryKey);
            const encryptedBody = await CryptoService.encrypt('', setupPin);
            const encryptedTitle = await CryptoService.encrypt('Untitled Note', setupPin);
            const encryptedTags = await CryptoService.encrypt(JSON.stringify([]), setupPin);

            await DB.saveNote(noteId, {
                ciphertext: encryptedBody.ciphertext,
                iv: encryptedBody.iv,
                salt: encryptedBody.salt,
                encryptedTitle,
                encryptedTags,
                recoverySeal,
                attachments: [],
                pinEnabled: true,
                updatedAt: new Date().toISOString(),
            });

            setKey(setupPin);
            setUnlockMode('pin');
            setPinEnabled(true);
            setIsNewNote(false);
            setShowPinSetup(false);
            setIsDecrypted(true);
            setContent('');
            setTitle('Untitled Note');
            setTags([]);
            addNoteToVault(noteId, 'Untitled Note');
        } catch (err) {
            setError('Could not set up your PIN. Please try again.');
        }
    };

    useEffect(() => {
        if (!isDecrypted) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(async () => {
            await saveNote();
        }, 1000);
    }, [content, title, tags]);

    const saveNote = async () => {
        setIsSaving(true);
        const finalKey = getFinalKey(unlockMode, key);
        try {
            const encryptedBody = await CryptoService.encrypt(content, finalKey);
            const encryptedTitle = await CryptoService.encrypt(title, finalKey);
            const encryptedTags = await CryptoService.encrypt(JSON.stringify(tags), finalKey);

            await DB.saveNote(noteId, {
                ciphertext: encryptedBody.ciphertext,
                iv: encryptedBody.iv,
                salt: encryptedBody.salt,
                encryptedTitle,
                encryptedTags,
                attachments,
                pinEnabled: unlockMode === 'pin' || pinEnabled,
                ttl: ttl,
                updatedAt: new Date().toISOString()
            });
            setTimeout(() => setIsSaving(false), 500);
        } catch (err) {
            console.error("Save failed", err);
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const finalKey = getFinalKey(unlockMode, key);
        try {
            const encryptedBlob = await CryptoService.encryptBlob(file, finalKey);
            const downloadUrl = await DB.uploadFile(noteId, file.name, encryptedBlob.ciphertext);

            const newAttachment = {
                name: file.name,
                url: downloadUrl,
                iv: encryptedBlob.iv,
                salt: encryptedBlob.salt,
                size: file.size
            };

            const updatedAttachments = [...attachments, newAttachment];
            setAttachments(updatedAttachments);
            await DB.saveNote(noteId, { attachments: updatedAttachments });
        } catch (err) {
            alert("File upload failed: " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadAttachment = async (file) => {
        const finalKey = getFinalKey(unlockMode, key);
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const encryptedBuffer = await blob.arrayBuffer();

            // Decrypt the binary buffer
            const salt = CryptoService.base64ToBuffer(file.salt);
            const iv = CryptoService.base64ToBuffer(file.iv);

            // Re-using deriveKey from CryptoService
            const encoder = new TextEncoder();
            const passwordKey = await window.crypto.subtle.importKey('raw', encoder.encode(finalKey), 'PBKDF2', false, ['deriveKey']);
            const cryptoKey = await window.crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
                passwordKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                cryptoKey,
                encryptedBuffer
            );

            const url = window.URL.createObjectURL(new Blob([decrypted]));
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
        } catch (err) {
            alert("Decryption failed. Your key might be incorrect.");
        }
    };

    const previewAttachment = async (file) => {
        if (!file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            downloadAttachment(file);
            return;
        }

        const finalKey = getFinalKey(unlockMode, key);
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const encryptedBuffer = await blob.arrayBuffer();
            const salt = CryptoService.base64ToBuffer(file.salt);
            const iv = CryptoService.base64ToBuffer(file.iv);
            const encoder = new TextEncoder();
            const passwordKey = await window.crypto.subtle.importKey('raw', encoder.encode(finalKey), 'PBKDF2', false, ['deriveKey']);
            const cryptoKey = await window.crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
                passwordKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                cryptoKey,
                encryptedBuffer
            );
            setPreviewFile(window.URL.createObjectURL(new Blob([decrypted])));
        } catch (err) {
            alert("Preview failed: " + err.message);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}${import.meta.env.BASE_URL}note/${noteId}`;
        await navigator.clipboard.writeText(url);
        alert("Shareable link copied! Send this link and the 6-digit PIN or recovery phrase to others.");
    };

    if (showPinSetup) {
        return (
            <motion.div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800"
                >
                    <h2 className="text-2xl font-bold text-center mb-2">Set your 6-digit PIN</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
                        Recovery phrase is saved. Choose any 6 digits for daily access to this note.
                    </p>
                    <form onSubmit={handlePinSetup} className="space-y-4">
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={setupPin}
                            onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-brand-500 text-center text-2xl tracking-[0.5em]"
                            placeholder="••••••"
                            autoFocus
                        />
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={setupPinConfirm}
                            onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-brand-500 text-center text-2xl tracking-[0.5em]"
                            placeholder="Confirm"
                        />
                        {error && (
                            <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                                <AlertCircle size={14} /> {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl"
                        >
                            Save PIN & open note
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        );
    }

    if (!isDecrypted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center"
                >
                    <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        {isNewNote ? 'Set up note' : 'Unlock note'}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
                        {isNewNote
                            ? 'Use your 12-word recovery phrase first. You will set a 6-digit PIN next.'
                            : pinEnabled
                                ? 'Enter your 6-digit PIN, or switch to recovery phrase if you forgot it.'
                                : 'Enter your recovery phrase to unlock this note.'}
                    </p>

                    {!isNewNote && pinEnabled && (
                        <motion.div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => { setUnlockMode('pin'); setKey(''); setError(''); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${unlockMode === 'pin' ? 'bg-white dark:bg-zinc-700 shadow-sm text-brand-600' : 'text-zinc-500'}`}
                            >
                                6-digit PIN
                            </button>
                            <button
                                type="button"
                                onClick={() => { setUnlockMode('recovery'); setKey(''); setError(''); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${unlockMode === 'recovery' ? 'bg-white dark:bg-zinc-700 shadow-sm text-brand-600' : 'text-zinc-500'}`}
                            >
                                Recovery phrase
                            </button>
                        </motion.div>
                    )}

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type={unlockMode === 'recovery' ? 'text' : 'password'}
                            inputMode={unlockMode === 'pin' ? 'numeric' : 'text'}
                            maxLength={unlockMode === 'pin' ? 6 : undefined}
                            value={key}
                            onChange={(e) => {
                                const v = unlockMode === 'pin'
                                    ? e.target.value.replace(/\D/g, '').slice(0, 6)
                                    : e.target.value;
                                setKey(v);
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-center text-lg tracking-widest"
                            placeholder={unlockMode === 'recovery' ? '12 word recovery phrase...' : '6-digit PIN'}
                            autoFocus
                        />
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-500 text-sm justify-center"
                            >
                                <AlertCircle size={14} /> {error}
                            </motion.div>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all transform active:scale-95"
                        >
                            Decrypt & Open
                        </button>
                    </form>
                    <div className="mt-6 flex flex-col gap-3">
                        <button onClick={() => setShowHelp(true)} className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors font-medium">
                            How does this work?
                        </button>
                        <button onClick={() => navigate('/')} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                            ← Back to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">How it Works</h3>
                                    <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">🔐 Zero-Knowledge Encryption</p>
                                        <p>Your notes are encrypted in your browser before being sent to the server. We never see your secret key or your content.</p>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">🔑 Recovery phrase & 6-digit PIN</p>
                                        <p>New notes require a <b>12-word recovery phrase</b> first, then a <b>6-digit PIN</b> for daily access. Forgot your PIN? Unlock with the recovery phrase.</p>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">🔗 Secure Sharing</p>
                                        <p>Share the Note ID link and the PIN or recovery phrase with someone you trust. They can then decrypt and view the note.</p>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">⏱️ Self-Destruct</p>
                                        <p>Set an expiry time (TTL) for your notes. Once it expires, the note is permanently removed from the server.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all"
                                >
                                    Got it!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-full"
                        >
                            <img
                                src={previewFile}
                                alt="Preview"
                                className="rounded-2xl shadow-2xl max-w-full max-h-[80vh] object-contain"
                            />
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <motion.div onClick={() => navigate('/')} className="cursor-pointer w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xs transition-transform hover:rotate-12">M</motion.div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent font-bold text-lg outline-none focus:ring-0 placeholder-zinc-300 dark:placeholder-zinc-600"
                        placeholder="Untitled Note"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                        {isSaving ? <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div> : <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        {isSaving ? 'Saving...' : 'Saved'}
                    </div>
                    <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-lg transition-all ${isPreview ? 'bg-brand-100 dark:bg-brand-900 text-brand-600' : 'text-zinc-500 hover:text-brand-600'}`}>
                        {isPreview ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button onClick={handleShare} className="p-2 text-zinc-500 hover:text-brand-600 rounded-lg transition-colors">
                        <Share2 size={20} />
                    </button>
                    <button onClick={() => {}} className="p-2 text-zinc-500 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-72 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-8 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto"
                >
                    {/* Tags Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Tag size={14} /> Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <motion.span
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    key={tag}
                                    className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-lg flex items-center gap-1"
                                >
                                    {tag}
                                    <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setTags(tags.filter(t => t !== tag))} />
                                </motion.span>
                            ))}
                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1">
                                <input
                                    type="text"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') { setTags([...tags, currentTag]); setCurrentTag(''); } }}
                                    className="bg-transparent outline-none text-xs w-20"
                                    placeholder="Add tag..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Paperclip size={14} /> Attachments
                            </h4>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="p-1 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-md transition-all"
                            >
                                <Upload size={14} />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <div className="grid grid-cols-1 gap-2">
                            {attachments.length === 0 ? (
                                <p className="text-[10px] text-zinc-400 italic">No attachments yet.</p>
                            ) : (
                                attachments.map((file, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-between group hover:border-brand-500 transition-all cursor-pointer"
                                        onClick={() => previewAttachment(file)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                                                {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? <FileText size={14} className="text-brand-500" /> : <FileText size={14} />}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                                                <span className="text-[9px] text-zinc-400">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadAttachment(file);
                                            }}
                                            className="p-2 text-zinc-400 hover:text-brand-600 transition-colors"
                                        >
                                            <Download size={14} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={14} /> Expiry (Hours)
                        </h4>
                        <input
                            type="number"
                            value={ttl}
                            onChange={(e) => setTtl(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none text-sm"
                            placeholder="0 = Permanent"
                        />
                    </div>
                </motion.div>

                <div className="flex-1 h-full relative">
                    <AnimatePresence mode="wait">
                        {!isPreview ? (
                            <motion.textarea
                                key="editor"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write in Markdown... ✍️"
                                className="w-full h-full p-8 md:p-12 lg:p-24 resize-none bg-transparent outline-none text-xl leading-relaxed placeholder-zinc-300 dark:placeholder-zinc-600 font-light"
                            />
                        ) : (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <MarkdownPreview content={content} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Editor;
