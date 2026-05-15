import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lock, Plus, FolderOpen, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB } from '../services\firebase-service';
import { MnemonicService } from '../services\mnemonic-service';
import { useVault } from '../hooks\useVault';

const Home = () => {
    const [noteId, setNoteId] = useState('');
    const [isMnemonicMode, setIsMnemonicMode] = useState(false);
    const [mnemonic, setMnemonic] = useState('');
    const { notes, addNoteToVault, removeNoteFromVault, clearVault } = useVault();
    const navigate = useNavigate();

    const handleCreateNew = () => {
        const id = DB.generateNoteId();
        navigate(`/note/${id}`);
    };

    const handleOpenNote = (e) => {
        e.preventDefault();
        if (noteId.trim()) {
            navigate(`/note/${noteId.trim()}`);
        }
    };

    const generateRecoveryPhrase = () => {
        const phrase = MnemonicService.generatePhrase();
        setMnemonic(phrase);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 overflow-hidden">
            <div className="w-full max-w-4xl text-center space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-4"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 text-white rounded-3xl mb-4 shadow-2xl shadow-brand-500/40 hover:rotate-12 transition-transform duration-300">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Lorapok <span className="text-brand-600">MindNode</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
                        A zero-knowledge, E2EE notepad. No accounts, no tracking, just your thoughts encrypted with a key only you know.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <motion.div
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateNew}
                        className="group p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer"
                    >
                        <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                            <Plus size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Create Note</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Start a new encrypted thought. You'll define the secret key.</p>
                    </motion.div>

                    <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl flex items-center justify-center mb-6">
                            <FolderOpen size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Open Existing</h3>
                        <form onSubmit={handleOpenNote} className="space-y-3">
                            <input
                                type="text"
                                value={noteId}
                                onChange={(e) => setNoteId(e.target.value)}
                                placeholder="Enter Note ID..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                            />
                            <button
                                type="submit"
                                className="w-full py-3 bg-zinc-900 dark:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-95"
                            >
                                Open Note
                            </button>
                        </form>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {notes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-left space-y-4"
                        >
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                                    <Archive size={20} className="text-brand-600" />
                                    <span className="tracking-tight">Your Vault</span>
                                </div>
                                <button
                                    onClick={clearVault}
                                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Clear All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {notes.map((note, idx) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-brand-500 transition-all"
                                    >
                                        <div
                                            className="cursor-pointer overflow-hidden"
                                            onClick={() => navigate(`/note/${note.id}`)}
                                        >
                                            <p className="text-sm font-medium truncate w-32">{note.title || 'Untitled'}</p>
                                            <p className="text-[10px] text-zinc-400 font-mono truncate">{note.id}</p>
                                        </div>
                                        <button
                                            onClick={() => removeNoteFromVault(note.id)}
                                            className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recovery Phrase Generator */}
                <div className="max-w-md mx-auto space-y-4 p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold justify-center">
                        <Key size={18} className="text-brand-600" />
                        <span>Recovery Toolkit</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">Generate a seed phrase to use as your Master Key for all notes.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={generateRecoveryPhrase}
                            className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} /> Generate Phrase
                        </button>
                    </div>
                    <AnimatePresence>
                        {mnemonic && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-200 dark:border-brand-800"
                            >
                                <p className="text-xs font-mono text-brand-700 dark:text-brand-300 break-words leading-relaxed">
                                    {mnemonic}
                                </p>
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(mnemonic); alert("Phrase copied!"); }}
                                        className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider"
                                    >
                                        Copy Phrase
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-sm">
                    <lock size={16} />
                    <span>Your Secret Key is never stored. Losing it means losing your data.</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
