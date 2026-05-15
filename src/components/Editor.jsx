import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Share2, Trash2, Download, LogOut, Save, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { CryptoService } from '../services\crypto-service';
import { DB } from '../services\firebase-service';
import { useVault } from '../hooks\useVault';
import MarkdownPreview from './MarkdownPreview';

const Editor = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const { addNoteToVault } = useVault();

    const [key, setKey] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('Untitled Note');
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const autoSaveTimer = useRef(null);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await DB.fetchNote(noteId);
            const decryptedText = await CryptoService.decrypt(
                data.ciphertext,
                key,
                data.iv,
                data.salt
            );

            setContent(decryptedText);
            setIsDecrypted(true);

            // Add to vault for convenience
            addNoteToVault(noteId, title);
        } catch (err) {
            setError('Invalid Secret Key or corrupted note.');
        }
    };

    useEffect(() => {
        if (!isDecrypted) return;

        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        autoSaveTimer.current = setTimeout(async () => {
            await saveNote();
        }, 1000);
    }, [content, title]);

    const saveNote = async () => {
        setIsSaving(true);
        try {
            const encrypted = await CryptoService.encrypt(content, key);
            await DB.saveNote(noteId, encrypted);
            setTimeout(() => setIsSaving(false), 500);
        } catch (err) {
            console.error("Save failed", err);
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/note/${noteId}`;
        await navigator.clipboard.writeText(url);
        alert("Shareable link copied! Send this link and the Secret Key to others.");
    };

    const handleDelete = async () => {
        if (!confirm("Delete this note forever? This action is irreversible.")) return;
        alert("Deletion logic would be called here.");
    };

    if (!isDecrypted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Unlock Note</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">Enter the Secret Key to decrypt this content.</p>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-center text-lg tracking-widest"
                            placeholder="••••••••"
                            autoFocus
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm justify-center animate-bounce">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all transform active:scale-95"
                        >
                            Decrypt & Open
                        </button>
                    </form>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    >
                        M
                    </div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent font-bold text-lg outline-none focus:ring-0 placeholder-zinc-300 dark:placeholder-zinc-600"
                        placeholder="Untitled Note"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`p-2 rounded-lg transition-all ${isPreview ? 'bg-brand-100 dark:bg-brand-900 text-brand-600' : 'text-zinc-500 hover:text-brand-600'}`}
                        title="Toggle Preview"
                    >
                        {isPreview ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                        {isSaving ? <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div> : <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        {isSaving ? 'Saving...' : 'Saved'}
                    </div>
                    <button
                        onClick={handleShare}
                        className="p-2 text-zinc-500 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors"
                        title="Share Link"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete Note"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex">
                {!isPreview ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write in Markdown... ✍️"
                        className="flex-1 p-8 md:p-12 lg:p-24 resize-none bg-transparent outline-none text-xl leading-relaxed placeholder-zinc-300 dark:placeholder-zinc-600 font-light"
                    />
                ) : (
                    <MarkdownPreview content={content} />
                )}
            </main>
        </div>
    );
};

export default Editor;
