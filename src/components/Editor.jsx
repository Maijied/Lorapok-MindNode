import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Share2, Trash2, Download, Upload, Eye, EyeOff, AlertCircle, Clock, Tag, X, FileText, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CryptoService } from '../services/crypto-service';
import { MnemonicService, isValidPin } from '../services/mnemonic-service';
import { DB } from '../services/firebase-service';
import { useVault } from '../hooks/useVault';
import MarkdownPreview from './MarkdownPreview';
import AttachmentGallery from './AttachmentGallery';
const Editor = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const { addNoteToVault, removeNoteFromVault } = useVault();
    const [key, setKey] = useState('');
    const [unlockMode, setUnlockMode] = useState('pin');
    const [isNewNote, setIsNewNote] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [setupPin, setSetupPin] = useState('');
    const [setupPinConfirm, setSetupPinConfirm] = useState('');
    const [generatedRecovery, setGeneratedRecovery] = useState('');
    const [showRecoveryReveal, setShowRecoveryReveal] = useState(false);
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('Untitled Note');
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [sessionSalt, setSessionSalt] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [ttl, setTtl] = useState(0);
    const autoSaveTimer = useRef(null);
    const fileInputRef = useRef(null);
    const getFinalKey = (mode, input) =>
        mode === 'recovery' ? MnemonicService.phraseToKey(input) : input;
    useEffect(() => {
        DB.getNoteMeta(noteId).then(({ exists, pinEnabled: hasPin }) => {
            const isNew = !exists;
            setIsNewNote(isNew);
            setPinEnabled(hasPin);
            if (isNew) {
                setShowPinSetup(true);
                setUnlockMode('pin');
            } else {
                setUnlockMode('pin');
            }
        });
    }, [noteId]);
    const handleUnlock = async (e) => {
        e.preventDefault();
        setError('');
        if (unlockMode === 'recovery' && !MnemonicService.validatePhrase(key)) {
            setError('Enter a valid 12-word recovery phrase.'); return;
        } else if (unlockMode === 'pin' && !isValidPin(key)) {
            setError('Enter a 6-digit PIN.'); return;
        }
        try {
            const data = await DB.fetchNote(noteId);
            let decryptKey = getFinalKey(unlockMode, key);
            if (unlockMode === 'recovery' && data.pinEnabled && data.recoverySeal) {
                const recoveredPin = await CryptoService.decrypt(data.recoverySeal.ciphertext, decryptKey, data.recoverySeal.iv, data.recoverySeal.salt);
                decryptKey = recoveredPin;
                setUnlockMode('pin');
                setKey(recoveredPin);
            }
            const decryptedText = await CryptoService.decrypt(data.ciphertext, decryptKey, data.iv, data.salt);
            let finalTitle = title;
            if (data.encryptedTitle) finalTitle = await CryptoService.decrypt(data.encryptedTitle.ciphertext, decryptKey, data.encryptedTitle.iv, data.encryptedTitle.salt);
            let finalTags = [];
            if (data.encryptedTags) {
                const decryptedTagsRaw = await CryptoService.decrypt(data.encryptedTags.ciphertext, decryptKey, data.encryptedTags.iv, data.encryptedTags.salt);
                finalTags = JSON.parse(decryptedTagsRaw);
            }
            setSessionSalt(data.salt); setContent(decryptedText); setTitle(finalTitle); setTags(finalTags); setAttachments(data.attachments || []); setIsDecrypted(true); addNoteToVault(noteId, finalTitle);
        } catch (err) {
            setError(unlockMode === 'recovery' ? 'Invalid recovery phrase.' : 'Invalid 6-digit PIN.');
        }
    };
    const handlePinSetup = async (e) => {
        e.preventDefault(); setError('');
        if (!isValidPin(setupPin)) { setError('PIN must be exactly 6 digits.'); return; }
        if (setupPin !== setupPinConfirm) { setError('PINs do not match.'); return; }
        try {
            const recoveryPhrase = MnemonicService.generatePhrase();
            const recoveryKey = MnemonicService.phraseToKey(recoveryPhrase);
            const recoverySeal = await CryptoService.encrypt(setupPin, recoveryKey);
            const encryptedBody = await CryptoService.encrypt('', setupPin);
            const encryptedTitle = await CryptoService.encrypt('Untitled Note', setupPin);
            const encryptedTags = await CryptoService.encrypt(JSON.stringify([]), setupPin);
            await DB.saveNote(noteId, { ciphertext: encryptedBody.ciphertext, iv: encryptedBody.iv, salt: encryptedBody.salt, encryptedTitle, encryptedTags, recoverySeal, attachments: [], pinEnabled: true });
            setSessionSalt(encryptedBody.salt); setKey(setupPin); setUnlockMode('pin'); setPinEnabled(true); setIsNewNote(false); setShowPinSetup(false); setGeneratedRecovery(recoveryPhrase); setShowRecoveryReveal(true); setSetupPin(''); setSetupPinConfirm('');
        } catch (err) { setError('Could not set up your PIN.'); }
    };
    const finishRecoveryReveal = () => { setShowRecoveryReveal(false); setIsDecrypted(true); setContent(''); setTitle('Untitled Note'); setTags([]); addNoteToVault(noteId, 'Untitled Note'); };
    useEffect(() => {
        if (!isDecrypted) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(async () => { await saveNote(); }, 1000);
    }, [content, title, tags]);
    const saveNote = async () => {
        setIsSaving(true);
        const finalKey = getFinalKey(unlockMode, key);
        try {
            const eb = await CryptoService.encrypt(content, finalKey, sessionSalt);
            const et = await CryptoService.encrypt(title, finalKey, sessionSalt || eb.salt);
            const eg = await CryptoService.encrypt(JSON.stringify(tags), finalKey, sessionSalt || eb.salt);
            await DB.saveNote(noteId, { ciphertext: eb.ciphertext, iv: eb.iv, salt: eb.salt, encryptedTitle: et, encryptedTags: eg, attachments, pinEnabled: true, ttl, updatedAt: new Date().toISOString() });
            if (!sessionSalt) setSessionSalt(eb.salt); addNoteToVault(noteId, title);
            setTimeout(() => setIsSaving(false), 500);
        } catch (err) { setIsSaving(false); }
    };
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setIsUploading(true);
        try {
            const eb = await CryptoService.encryptBlob(file, getFinalKey(unlockMode, key));
            const url = await DB.uploadFile(noteId, file.name, eb.ciphertext);
            const ua = [...attachments, { name: file.name, url, iv: eb.iv, salt: eb.salt, size: file.size }];
            setAttachments(ua); await DB.saveNote(noteId, { attachments: ua });
        } catch (err) { alert("File upload failed."); } finally { setIsUploading(false); }
    };
    const previewAttachment = async (att) => {
        try {
            const data = await DB.downloadFile(att.url);
            const decrypted = await CryptoService.decryptBlob(data, getFinalKey(unlockMode, key), att.iv, att.salt);
            setPreviewFile(URL.createObjectURL(decrypted));
        } catch (err) { alert("Could not preview file."); }
    };
    const downloadAttachment = async (att) => {
        try {
            const data = await DB.downloadFile(att.url);
            const decrypted = await CryptoService.decryptBlob(data, getFinalKey(unlockMode, key), att.iv, att.salt);
            const url = URL.createObjectURL(decrypted);
            const a = document.createElement('a'); a.href = url; a.download = att.name; a.click();
        } catch (err) { alert("Could not download file."); }
    };
    const handleDeleteAttachment = async (att) => {
        if (!confirm(`Delete ${att.name}?`)) return;
        try {
            await DB.deleteFile(att.url);
            const ua = attachments.filter(a => a.url !== att.url);
            setAttachments(ua); await DB.saveNote(noteId, { attachments: ua });
        } catch (err) { alert("Could not delete file."); }
    };
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied! Share it with someone who has your PIN/phrase.");
    };
    const handleDeleteNote = async () => {
        if (!confirm("Are you sure? This will permanently delete the note and all attachments.")) return;
        try {
            for (const att of attachments) await DB.deleteFile(att.url);
            await DB.deleteNote(noteId);
            removeNoteFromVault(noteId);
            navigate('/');
        } catch (err) { alert("Could not delete note."); }
    };
    if (showPinSetup) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
                <h2 className="text-2xl font-bold text-center mb-2">Secure your note</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm mb-8">Set a 6-digit PIN to encrypt your thoughts. We'll generate a recovery phrase for you next.</p>
                <form onSubmit={handlePinSetup} className="space-y-4">
                    <input type="password" inputMode="numeric" maxLength={6} value={setupPin} onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none text-center text-2xl tracking-[0.5em]" placeholder="••••••" autoFocus />
                    <input type="password" inputMode="numeric" maxLength={6} value={setupPinConfirm} onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none text-center text-2xl tracking-[0.5em]" placeholder="Confirm" />
                    {error && <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1"><AlertCircle size={14} /> {error}</p>}
                    <button type="submit" className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl">Continue</button>
                </form>
                <button type="button" onClick={() => navigate('/')} className="w-full mt-4 text-sm text-zinc-400 hover:text-zinc-600">← Back to Home</button>
            </motion.div>
        </div>
    );
    if (showRecoveryReveal) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><FileText size={32} /></div>
                <h2 className="text-2xl font-bold mb-2">Save your recovery phrase</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">This is the ONLY way to recover your note if you forget your PIN. Write it down and keep it safe.</p>
                <div className="p-6 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-200 dark:border-brand-800 mb-8">
                    <p className="font-mono text-brand-700 dark:text-brand-300 break-words leading-relaxed">{generatedRecovery}</p>
                </div>
                <button onClick={finishRecoveryReveal} className="w-full py-3 bg-zinc-900 dark:bg-brand-600 text-white font-semibold rounded-xl">I've saved it, let's go</button>
            </motion.div>
        </div>
    );
    if (!isDecrypted) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
                <h2 className="text-2xl font-bold mb-8">Unlock note</h2>
                {pinEnabled && (
                    <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <button type="button" onClick={() => { setUnlockMode('pin'); setKey(''); setError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${unlockMode === 'pin' ? 'bg-white dark:bg-zinc-700 shadow-sm text-brand-600' : 'text-zinc-500'}`}>6-digit PIN</button>
                        <button type="button" onClick={() => { setUnlockMode('recovery'); setKey(''); setError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${unlockMode === 'recovery' ? 'bg-white dark:bg-zinc-700 shadow-sm text-brand-600' : 'text-zinc-500'}`}>Recovery phrase</button>
                    </div>
                )}
                <form onSubmit={handleUnlock} className="space-y-4">
                    <input type={unlockMode === 'recovery' ? 'text' : 'password'} inputMode={unlockMode === 'pin' ? 'numeric' : 'text'} maxLength={unlockMode === 'pin' ? 6 : undefined} value={key} onChange={(e) => setKey(unlockMode === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none text-center text-lg tracking-widest" placeholder={unlockMode === 'recovery' ? '12 word recovery phrase...' : '6-digit PIN'} autoFocus />
                    {error && <div className="flex items-center gap-2 text-red-500 text-sm justify-center"><AlertCircle size={14} /> {error}</div>}
                    <button type="submit" className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl">Decrypt & Open</button>
                </form>
                <div className="mt-6 flex flex-col gap-3">
                    <button onClick={() => setShowHelp(true)} className="text-sm text-brand-600 font-medium">How does this work?</button>
                    <button onClick={() => navigate('/')} className="text-sm text-zinc-400">← Back to Home</button>
                </div>
            </motion.div>
        </div>
    );
    return (
        <div className="h-screen flex flex-col bg-white dark:bg-zinc-950">
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <motion.img src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="Lorapok MindNode home" onClick={() => navigate('/')} className="cursor-pointer w-8 h-8 rounded-lg" whileTap={{ scale: 0.95 }} />
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent font-bold text-lg outline-none placeholder-zinc-300" placeholder="Untitled Note" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-medium">
                        <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-brand-500 animate-pulse' : 'bg-green-500'}`}></div>
                        {isSaving ? 'Saving...' : 'Saved'}
                    </div>
                    <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-lg ${isPreview ? 'bg-brand-100 text-brand-600' : 'text-zinc-500'}`}>{isPreview ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    <button onClick={handleShare} className="p-2 text-zinc-500 hover:text-brand-600 rounded-lg"><Share2 size={20} /></button>
                    <button onClick={handleDeleteNote} className="p-2 text-zinc-500 hover:text-red-500 rounded-lg"><Trash2 size={20} /></button>
                </div>
            </header>
            <main className="flex-1 overflow-hidden flex">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-72 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-8 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Tag size={14} /> Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <motion.span key={tag} className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-lg flex items-center gap-1">
                                    {tag} <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setTags(tags.filter(t => t !== tag))} />
                                </motion.span>
                            ))}
                            <input type="text" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { setTags([...tags, currentTag]); setCurrentTag(''); } }} className="bg-transparent outline-none text-xs w-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1" placeholder="Add tag..." />
                        </div>
                    </div>
                    <AttachmentGallery attachments={attachments} onPreview={previewAttachment} onDownload={downloadAttachment} onDelete={handleDeleteAttachment} isUploading={isUploading} />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Upload size={14} /> Upload</h4><button onClick={() => fileInputRef.current.click()} className="p-1 text-brand-600 hover:bg-brand-100 rounded-md"><Paperclip size={14} /></button></div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2"><Clock size={14} /> Expiry (Hours)</h4>
                        <input type="number" value={ttl} onChange={(e) => setTtl(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none text-sm" placeholder="0 = Permanent" />
                    </div>
                </motion.div>
                <div className="flex-1 h-full relative">
                    <AnimatePresence mode="wait">
                        {!isPreview ? (
                            <motion.textarea key="editor" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write in Markdown... ✍️" className="w-full h-full p-8 md:p-12 lg:p-24 resize-none bg-transparent outline-none text-xl leading-relaxed font-light" />
                        ) : (
                            <motion.div key="preview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full"><MarkdownPreview content={content} /></motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
            <AnimatePresence>
                {previewFile && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md" onClick={() => setPreviewFile(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl max-h-full">
                            <img src={previewFile} alt="Preview" className="rounded-2xl shadow-2xl max-w-full max-h-[80vh] object-contain" />
                            <button onClick={() => setPreviewFile(null)} className="absolute -top-12 right-0 p-2 text-white"><X size={24} /></button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default Editor;
