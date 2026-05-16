import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Key, Hash, FolderOpen, Share2, AlertTriangle } from 'lucide-react';

const steps = [
    { icon: FolderOpen, title: 'Create or open a note', body: 'Create a new note to get a unique Note ID, or paste an existing Note ID to open it.' },
    { icon: Hash, title: 'New note: set a 6-digit PIN', body: 'When you create a note, pick any 6 digits for daily unlock. That is all you need to open and save the note.' },
    { icon: Key, title: 'Recovery phrase (auto-generated)', body: 'After setting your PIN, copy the 12-word recovery phrase shown once. You only need it if you forget your PIN.' },
    { icon: ShieldCheck, title: 'Forgot your PIN?', body: 'On unlock, switch to Recovery Phrase and enter those 12 words to regain access.' },
    { icon: Share2, title: 'Share securely', body: 'Share the note link plus the PIN or recovery phrase with someone you trust.' },
    { icon: AlertTriangle, title: 'We cannot reset your keys', body: 'If you lose both the recovery phrase and PIN, the note cannot be recovered.' },
];

export default function HowToUseModal({ open, onClose }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 16 }}
                        className="w-full max-w-lg max-h-[min(90vh,720px)] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">Guide</p>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">How to use MindNode</h2>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-4 flex-1">
                            {steps.map((step, idx) => {
                                const Icon = step.icon;
                                return (
                                    <motion.div key={step.title} className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="text-left min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon size={16} className="text-brand-600 shrink-0" />
                                                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                                            </div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.body}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="p-6 pt-2 shrink-0 border-t border-zinc-100 dark:border-zinc-800">
                            <button type="button" onClick={onClose} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl">
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
