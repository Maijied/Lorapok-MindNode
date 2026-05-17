import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Trash2, Eye, X } from 'lucide-react';

const AttachmentGallery = ({ attachments, onPreview, onDownload, onDelete, isUploading }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    Attachments ({attachments.length})
                </h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <AnimatePresence>
                    {attachments.map((file, idx) => (
                        <motion.div
                            key={file.url || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group relative p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-brand-500 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                                    {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ?
                                        <Eye size={18} className="text-brand-500" /> :
                                        <FileText size={18} />
                                    }
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-semibold truncate pr-8">{file.name}</span>
                                    <span className="text-[10px] text-zinc-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>

                            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onPreview(file)}
                                    className="p-1.5 text-zinc-400 hover:text-brand-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-all"
                                    title="Preview"
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    onClick={() => onDownload(file)}
                                    className="p-1.5 text-zinc-400 hover:text-brand-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-all"
                                    title="Download"
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    onClick={() => onDelete(file)}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isUploading && (
                    <div className="p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-zinc-500">Uploading...</span>
                    </div>
                )}

                {attachments.length === 0 && !isUploading && (
                    <div className="py-8 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-zinc-400">
                        <FileText size={24} className="mb-2 opacity-20" />
                        <p className="text-[10px] italic">No attachments yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttachmentGallery;
