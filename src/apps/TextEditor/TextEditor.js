import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';

export class TextEditor {
    static instances = new Map();

    static createNewInstance(options = {}) {
        const { fileName = 'Untitled', filePath = null, content = '' } = options;

        const icon = '<i class="ph ph-file-text" style="font-size:16px; color:#1976d2;"></i>';

        const windowContent = this.getWindowContent();

        const windowId = WindowManager.createWindow('texteditor', {
            title: `${fileName} - Text Editor`,
            width: 700,
            height: 500,
            content: windowContent,
            icon: icon
        });

        this.instances.set(windowId, {
            fileName: fileName,
            filePath: filePath,
            isModified: false,
            wordWrap: true
        });

        this.initInstance(windowId, content);

        console.log(`[TextEditor] Created new instance: ${windowId}`);
        return windowId;
    }

    static getWindowContent() {
        return `
            <div class="te-menubar">
                <div class="te-menu-item te-menu-file">
                    File
                    <div class="te-dropdown te-file-dropdown">
                        <div class="te-dropdown-item" data-action="new"><span>New</span><span class="shortcut">Ctrl+N</span></div>
                        <div class="te-dropdown-item" data-action="open"><span>Open...</span><span class="shortcut">Ctrl+O</span></div>
                        <div class="te-dropdown-item" data-action="save"><span>Save</span><span class="shortcut">Ctrl+S</span></div>
                        <div class="te-dropdown-item" data-action="saveas"><span>Save As...</span></div>
                        <div class="te-divider"></div>
                        <div class="te-dropdown-item" data-action="close"><span>Exit</span></div>
                    </div>
                </div>
                <div class="te-menu-item te-menu-edit">
                    Edit
                    <div class="te-dropdown te-edit-dropdown">
                        <div class="te-dropdown-item" data-action="undo"><span>Undo</span><span class="shortcut">Ctrl+Z</span></div>
                        <div class="te-dropdown-item" data-action="redo"><span>Redo</span><span class="shortcut">Ctrl+Y</span></div>
                        <div class="te-divider"></div>
                        <div class="te-dropdown-item" data-action="cut"><span>Cut</span><span class="shortcut">Ctrl+X</span></div>
                        <div class="te-dropdown-item" data-action="copy"><span>Copy</span><span class="shortcut">Ctrl+C</span></div>
                        <div class="te-dropdown-item" data-action="paste"><span>Paste</span><span class="shortcut">Ctrl+V</span></div>
                        <div class="te-divider"></div>
                        <div class="te-dropdown-item" data-action="selectall"><span>Select All</span><span class="shortcut">Ctrl+A</span></div>
                        <div class="te-dropdown-item" data-action="find"><span>Find...</span><span class="shortcut">Ctrl+F</span></div>
                    </div>
                </div>
                <div class="te-menu-item te-menu-view">
                    View
                    <div class="te-dropdown te-view-dropdown">
                        <div class="te-dropdown-item" data-action="wordwrap"><span>Word Wrap</span><span class="shortcut">✓</span></div>
                        <div class="te-dropdown-item" data-action="fontsize"><span>Font Size...</span></div>
                        <div class="te-divider"></div>
                        <div class="te-dropdown-item" data-action="statusbar"><span>Status Bar</span><span class="shortcut">✓</span></div>
                    </div>
                </div>
            </div>

            <div class="te-editor-container" style="flex:1; overflow:hidden;">
                <textarea class="te-textarea" spellcheck="false" placeholder="Start typing..."></textarea>
            </div>

            <div class="te-statusbar">
                <span class="te-status-text">Ready</span>
                <span class="te-status-position">Ln 1, Col 1</span>
            </div>
        `;
    }

    static initInstance(windowId, content = '') {
        const win = document.getElementById(windowId);
        if (!win) return;

        const textarea = win.querySelector('.te-textarea');
        const statusText = win.querySelector('.te-status-text');
        const statusPosition = win.querySelector('.te-status-position');

        if (content) {
            textarea.value = content;
        }

        win.querySelectorAll('.te-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleInstanceAction(windowId, item.dataset.action);
                win.querySelectorAll('.te-dropdown').forEach(d => d.style.display = 'none');
            });
        });

        win.querySelectorAll('.te-menu-item').forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = menu.querySelector('.te-dropdown');
                const isVisible = dropdown.style.display === 'block';
                win.querySelectorAll('.te-dropdown').forEach(d => d.style.display = 'none');
                if (!isVisible) dropdown.style.display = 'block';
            });
        });

        win.addEventListener('click', () => {
            win.querySelectorAll('.te-dropdown').forEach(d => d.style.display = 'none');
        });

        textarea.addEventListener('input', () => {
            const state = this.instances.get(windowId);
            if (state && !state.isModified) {
                state.isModified = true;
                this.updateInstanceTitle(windowId);
            }
        });

        textarea.addEventListener('keyup', () => {
            this.updateInstanceStatus(windowId);
        });

        textarea.addEventListener('click', () => {
            this.updateInstanceStatus(windowId);
        });

        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.handleInstanceAction(windowId, 'save');
                        break;
                    case 'o':
                        e.preventDefault();
                        this.handleInstanceAction(windowId, 'open');
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNewInstance();
                        break;
                }
            }
        });
    }

    static updateInstanceTitle(windowId) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const title = `${state.isModified ? '• ' : ''}${state.fileName} - Text Editor`;
        WindowManager.setWindowTitle(windowId, title);
    }

    static updateInstanceStatus(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const textarea = win.querySelector('.te-textarea');
        const statusPosition = win.querySelector('.te-status-position');

        if (textarea && statusPosition) {
            const text = textarea.value.substring(0, textarea.selectionStart);
            const lines = text.split('\n');
            const ln = lines.length;
            const col = lines[lines.length - 1].length + 1;
            statusPosition.textContent = `Ln ${ln}, Col ${col}`;
        }
    }

    static async handleInstanceAction(windowId, action) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const textarea = win.querySelector('.te-textarea');
        const state = this.instances.get(windowId);
        if (!state) return;

        const { DialogService } = await import('../../system/lib/DialogService.js');

        switch (action) {
            case 'new':
                this.createNewInstance();
                break;

            case 'open': {
                const { FilePickerDialog } = await import('../../system/components/Dialogs/FilePickerDialog.js');
                const openPath = await FilePickerDialog.pickFile({
                    title: 'Open File',
                    startPath: '/home/user',
                    filters: ['.txt', '.md', '.js', '.css', '.html', '.json', '.xml', '.py', '.sh', '.log']
                });
                if (openPath) {
                    await this.openFileInInstance(windowId, openPath);
                }
                break;
            }

            case 'save':
                await this.saveInstance(windowId);
                break;

            case 'saveas':
                state.filePath = null;
                await this.saveInstance(windowId);
                break;

            case 'close':
                if (state.isModified) {
                    const discard = await DialogService.confirm('You have unsaved changes. Discard?', { title: 'Unsaved Changes' });
                    if (!discard) return;
                }
                WindowManager.closeWindow(windowId, 'texteditor');
                this.instances.delete(windowId);
                break;

            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
            case 'selectall':
                textarea.select();
                break;
            case 'find': {
                const query = await DialogService.prompt('Find:', '', { title: 'Find' });
                if (query) {
                    const idx = textarea.value.indexOf(query);
                    if (idx >= 0) {
                        textarea.focus();
                        textarea.setSelectionRange(idx, idx + query.length);
                    } else {
                        await DialogService.alert('Text not found', { title: 'Find' });
                    }
                }
                break;
            }
            case 'wordwrap':
                state.wordWrap = !state.wordWrap;
                textarea.style.whiteSpace = state.wordWrap ? 'pre-wrap' : 'pre';
                textarea.style.overflowX = state.wordWrap ? 'hidden' : 'auto';
                break;
        }
    }

    static async openFileInInstance(windowId, filePath) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const textarea = win.querySelector('.te-textarea');
        const state = this.instances.get(windowId);
        if (!state) return;

        const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
        const { DialogService } = await import('../../system/lib/DialogService.js');

        try {
            const result = await FileSystemService.read(filePath);
            if (result && result.content !== undefined) {
                textarea.value = result.content;
                state.filePath = filePath;
                state.fileName = filePath.split('/').pop();
                state.isModified = false;
                this.updateInstanceTitle(windowId);
            } else {
                await DialogService.alert('Failed to read file', { title: 'Error', type: 'error' });
            }
        } catch (error) {
            await DialogService.alert(`Error: ${error.message}`, { title: 'Error', type: 'error' });
        }
    }

    static async saveInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const textarea = win.querySelector('.te-textarea');
        const state = this.instances.get(windowId);
        if (!state) return;

        const { DialogService } = await import('../../system/lib/DialogService.js');

        if (!state.filePath) {
            const { FilePickerDialog } = await import('../../system/components/Dialogs/FilePickerDialog.js');
            const result = await FilePickerDialog.saveAs(state.fileName, {
                title: 'Save As',
                startPath: '/home/user'
            });

            if (!result) return;

            state.filePath = result.fullPath;
            state.fileName = result.filename;
        }

        try {
            const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
            const { AuthService } = await import('../../system/lib/AuthService.js');

            console.log('[TextEditor] Saving instance:', windowId, 'to', state.filePath);
            console.log('[TextEditor] Session active:', AuthService.isSessionActive());

            const success = await FileSystemService.write(state.filePath, textarea.value, true);

            if (success) {
                state.isModified = false;
                this.updateInstanceTitle(windowId);
                await DialogService.alert(`File saved to ${state.filePath}`, { title: 'Saved', type: 'success' });
            } else {
                await DialogService.alert('Failed to save file', { title: 'Error', type: 'error' });
            }
        } catch (error) {
            await DialogService.alert(`Error: ${error.message}`, { title: 'Error', type: 'error' });
        }
    }
}

