import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lock, Plus, FolderOpen, ShieldCheck, Trash2, Archive } from 'lucide-react';
import { DB } from '../services\firebase-service';
import { useVault } from '../hooks\useVault';

const Home = () => {
    const [noteId, setNoteId] = useState('');
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            <div className="w-full max-w-4xl text-center space-y-12">
                {/* Branding */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 text-white rounded-3xl mb-4 shadow-2xl shadow-brand-500/40">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Lorapok <span className="text-brand-600">MindNode</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
                        A zero-knowledge, E2EE notepad. No accounts, no tracking, just your thoughts encrypted with a key only you know.
                    </p>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create Card */}
                    <div
                        onClick={handleCreateNew}
                        className="group p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer transform hover:-translate-y-2"
                    >
                        <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Create Note</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Start a new encrypted thought. You'll define the secret key.</p>
                    </div>

                    {/* Open Card */}
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
                </div>

                {/* Vault Section */}
                {notes.length > 0 && (
                    <div className="text-left space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                                <Archive size={20} className="text-brand-600" />
                                <span>Your Vault</span>
                            </div>
                            <button
                                onClick={clearVault}
                                className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {notes.map(note => (
                                <div
                                    key={note.id}
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Security Hint */}
                <div className="p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-sm">
                    <lock size={16} />
                    <span>Your Secret Key is never stored. Losing it means losing your data.</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
