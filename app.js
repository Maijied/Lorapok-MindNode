/**
 * Main Application Module
 * Orchestrates UI updates and connects Auth/DB modules.
 */

const App = {
    state: {
        currentUser: null,
        currentNote: null,
        notes: [],
        isDarkMode: localStorage.getItem('darkMode') === 'true',
    },

    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupAuthListener();
        this.applyTheme();
    },

    cacheElements() {
        this.views = {
            auth: document.getElementById('auth-view'),
            dashboard: document.getElementById('dashboard-view'),
            share: document.getElementById('share-view'),
            pinOverlay: document.getElementById('pin-overlay'),
            sharedContent: document.getElementById('shared-note-content')
        };
        this.inputs = {
            email: document.getElementById('auth-email'),
            password: document.getElementById('auth-password'),
            search: document.getElementById('search-notes'),
            title: document.getElementById('note-title'),
            body: document.getElementById('note-body')
        };
        this.btns = {
            login: document.getElementById('btn-login'),
            signup: document.getElementById('btn-signup'),
            logout: document.getElementById('btn-logout'),
            newNote: document.getElementById('btn-new-note'),
            theme: document.getElementById('btn-theme-toggle'),
            share: document.getElementById('btn-share'),
            delete: document.getElementById('btn-delete-note'),
            verifyPin: document.getElementById('btn-verify-pin')
        };
        this.ui = {
            notesList: document.getElementById('notes-list'),
            editorHeader: document.getElementById('editor-header'),
            editorContainer: document.getElementById('editor-container'),
            emptyEditor: document.getElementById('empty-editor'),
            saveStatus: document.getElementById('save-status'),
            modal: document.getElementById('modal-overlay'),
            modalContent: document.getElementById('modal-content'),
            pinInput: document.getElementById('pin-input'),
            sharedTitle: document.getElementById('shared-title'),
            sharedBody: document.getElementById('shared-body')
        };
    },

    bindEvents() {
        // Auth
        this.btns.login.onclick = () => this.handleAuth('login');
        this.btns.signup.onclick = () => this.handleAuth('signup');
        this.btns.logout.onclick = () => Auth.logout();

        // App
        this.btns.theme.onclick = () => this.toggleTheme();
        this.btns.newNote.onclick = () => this.createNewNote();
        this.btns.share.onclick = () => this.openShareModal();
        this.btns.delete.onclick = () => this.deleteCurrentNote();

        // Editor
        this.inputs.title.oninput = () => this.autoSave();
        this.inputs.body.oninput = () => this.autoSave();

        // Search
        this.inputs.search.oninput = (e) => this.filterNotes(e.target.value);

        // Shareable Link logic
        this.btns.verifyPin.onclick = () => this.verifyPin();

        // Close modal when clicking overlay
        this.ui.modal.onclick = (e) => {
            if (e.target === this.ui.modal) this.closeModal();
        };
    },

    setupAuthListener() {
        Auth.onAuthStateChanged(user => {
            this.state.currentUser = user;
            if (user) {
                this.switchView('dashboard');
                this.loadNotes();
            } else {
                // Check if we are in "Share" mode (URL contains noteId)
                const params = new URLSearchParams(window.location.search);
                if (params.has('noteId')) {
                    this.handleShareLink(params.get('noteId'));
                } else {
                    this.switchView('auth');
                }
            }
        });
    },

    async handleAuth(type) {
        const email = this.inputs.email.value;
        const password = this.inputs.password.value;

        try {
            if (type === 'login') await Auth.login(email, password);
            else await Auth.signUp(email, password);
        } catch (error) {
            alert(`Auth Error: ${error.message}`);
        }
    },

    switchView(viewName) {
        Object.values(this.views).forEach(v => v.classList.add('hidden'));
        this.views[viewName].classList.remove('hidden');
    },

    async loadNotes() {
        this.ui.notesList.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div></div>';
        try {
            const notes = await DB.fetchUserNotes(this.state.currentUser.uid);
            this.state.notes = notes;
            this.renderNotesList();
        } catch (error) {
            alert("Error loading notes: " + error.message);
        }
    },

    renderNotesList(filter = '') {
        this.ui.notesList.innerHTML = '';
        const filtered = this.state.notes.filter(n =>
            n.title.toLowerCase().includes(filter.toLowerCase()) ||
            n.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()))
        );

        if (filtered.length === 0) {
            this.ui.notesList.innerHTML = `<div class="text-center py-10 text-zinc-400 text-sm">No notes found</div>`;
            return;
        }

        filtered.forEach(note => {
            const div = document.createElement('div');
            div.className = `p-3 rounded-xl cursor-pointer transition-all transform active:scale-95 note-item-anim ${this.state.currentNote?.id === note.id ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`;
            div.innerHTML = `
                <div class="font-medium truncate">${note.title || 'Untitled Note'}</div>
                <div class="text-xs opacity-60 truncate">${note.content.substring(0, 35)}...</div>
            `;
            div.onclick = () => this.selectNote(note);
            this.ui.notesList.appendChild(div);
        });
    },

    selectNote(note) {
        this.state.currentNote = note;
        this.renderNotesList(this.inputs.search.value);

        this.ui.emptyEditor.classList.add('hidden');
        this.ui.editorHeader.classList.remove('hidden');
        this.ui.editorContainer.classList.remove('hidden');
        this.inputs.body.classList.remove('hidden');

        this.inputs.title.value = note.title;
        this.inputs.body.value = note.content;
        this.ui.saveStatus.innerText = 'Saved';
    },

    async createNewNote() {
        try {
            const note = await DB.createNote(this.state.currentUser.uid);
            this.state.notes.unshift(note);
            this.renderNotesList();
            this.selectNote(note);
        } catch (error) {
            alert("Error creating note: " + error.message);
        }
    },

    async autoSave() {
        if (!this.state.currentNote) return;
        this.ui.saveStatus.innerText = 'Saving...';

        const updates = {
            title: this.inputs.title.value,
            content: this.inputs.body.value
        };

        try {
            await DB.updateNote(this.state.currentNote.id, updates);
            this.state.currentNote = { ...this.state.currentNote, ...updates };
            this.ui.saveStatus.innerText = 'Saved';

            // Update list item title in real-time
            this.renderNotesList(this.inputs.search.value);
        } catch (error) {
            this.ui.saveStatus.innerText = 'Error saving';
        }
    },

    async deleteCurrentNote() {
        if (!this.state.currentNote) return;
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            await DB.deleteNote(this.state.currentNote.id);
            this.state.notes = this.state.notes.filter(n => n.id !== this.state.currentNote.id);
            this.state.currentNote = null;
            this.renderNotesList();
            this.ui.editorHeader.classList.add('hidden');
            this.ui.emptyEditor.classList.remove('hidden');
            this.inputs.body.classList.add('hidden');
        } catch (error) {
            alert("Error deleting note: " + error.message);
        }
    },

    filterNotes(val) {
        this.renderNotesList(val);
    },

    toggleTheme() {
        this.state.isDarkMode = !this.state.isDarkMode;
        localStorage.setItem('darkMode', this.state.isDarkMode);
        this.applyTheme();
    },

    applyTheme() {
        if (this.state.isDarkMode) {
            document.documentElement.classList.add('dark');
            document.getElementById('sun-icon').classList.remove('hidden');
            document.getElementById('moon-icon').classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            document.getElementById('sun-icon').classList.add('hidden');
            document.getElementById('moon-icon').classList.remove('hidden');
        }
    },

    // Share Logic
    openShareModal() {
        if (!this.state.currentNote) return;

        const pin = prompt("Set a 4-digit PIN for this note:", this.state.currentNote.sharePin || "");
        if (pin === null) return;
        if (pin.length !== 4 || isNaN(pin)) {
            alert("PIN must be exactly 4 digits.");
            return;
        }

        this.saveShareSettings(pin);
    },

    async saveShareSettings(pin) {
        try {
            await DB.updateNote(this.state.currentNote.id, {
                sharePin: pin,
                isPublic: true
            });

            const shareUrl = `${window.location.origin}${window.location.pathname}?noteId=${this.state.currentNote.id}`;

            this.showModal(`
                <h3 class="text-xl font-bold mb-4">Note Shared!</h3>
                <p class="text-zinc-500 dark:text-zinc-400 mb-4 text-sm">Anyone with this link and the PIN <b>${pin}</b> can view this note.</p>
                <div class="flex gap-2">
                    <input type="text" readonly value="${shareUrl}" class="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none">
                    <button id="btn-copy-link" class="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold">Copy</button>
                </div>
            `);

            document.getElementById('btn-copy-link').onclick = () => {
                navigator.clipboard.writeText(shareUrl);
                alert("Link copied to clipboard!");
                this.closeModal();
            };
        } catch (error) {
            alert("Error enabling sharing: " + error.message);
        }
    },

    async handleShareLink(noteId) {
        this.switchView('share');
        try {
            const note = await DB.getNoteById(noteId);
            if (!note.isPublic) {
                alert("This note is not public.");
                this.switchView('auth');
                return;
            }
            this.state.sharedNote = note;
            this.ui.pinOverlay.classList.remove('hidden');
            this.ui.sharedContent.classList.add('hidden');
        } catch (error) {
            alert("Note not found or error loading: " + error.message);
            this.switchView('auth');
        }
    },

    verifyPin() {
        const pin = this.ui.pinInput.value;
        if (pin === this.state.sharedNote.sharePin) {
            this.ui.pinOverlay.classList.add('hidden');
            this.ui.sharedContent.classList.remove('hidden');
            this.ui.sharedTitle.innerText = this.state.sharedNote.title;
            this.ui.sharedBody.innerText = this.state.sharedNote.content;
        } else {
            alert("Incorrect PIN. Please try again.");
            this.ui.pinInput.value = '';
        }
    },

    showModal(html) {
        this.ui.modalContent.innerHTML = html;
        this.ui.modal.classList.remove('hidden');
        setTimeout(() => {
            this.ui.modalContent.classList.remove('scale-95', 'opacity-0');
            this.ui.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeModal() {
        this.ui.modalContent.classList.add('scale-95', 'opacity-0');
        this.ui.modalContent.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => this.ui.modal.classList.add('hidden'), 200);
    }
};

App.init();
