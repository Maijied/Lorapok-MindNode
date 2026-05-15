import { useState, useEffect } from 'react';

export const useVault = () => {
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('mindnode_vault');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load vault", e);
            }
        }
    }, []);

    const addNoteToVault = (noteId, title) => {
        const newNotes = [...notes, { id: noteId, title, addedAt: new Date().toISOString() }];
        const uniqueNotes = Array.from(new Map(newNotes.map(item => [item.id, item])).values());
        setNotes(uniqueNotes);
        localStorage.setItem('mindnode_vault', JSON.stringify(uniqueNotes));
    };

    const removeNoteFromVault = (noteId) => {
        const filtered = notes.filter(n => n.id !== noteId);
        setNotes(filtered);
        localStorage.setItem('mindnode_vault', JSON.stringify(filtered));
    };

    const clearVault = () => {
        setNotes([]);
        localStorage.removeItem('mindnode_vault');
    };

    return { notes, addNoteToVault, removeNoteFromVault, clearVault };
};
