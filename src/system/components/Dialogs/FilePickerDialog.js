import { FileSystemService } from '../../lib/FileSystemService.js';
import { AuthService } from '../../lib/AuthService.js';

export class FilePickerDialog {
    static dialogContainer = null;
    static stylesInjected = false;
    static currentPath = '/home/user';
    static selectedItems = [];
    static mode = 'file';
    static resolvePromise = null;
    static filters = [];
    static showHidden = false;

    static init() {
        if (this.dialogContainer) return;

        this.dialogContainer = document.createElement('div');
        this.dialogContainer.id = 'file-picker-container';
        document.body.appendChild(this.dialogContainer);

        if (!this.stylesInjected) {
            this.injectStyles();
            this.stylesInjected = true;
        }
    }

    static injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .fp-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 50000;
                animation: fpFadeIn 0.2s ease;
            }

            @keyframes fpFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fpDialogIn {
                from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            .fp-dialog {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
                width: 750px;
                height: 500px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: fpDialogIn 0.25s ease;
            }

            .fp-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: linear-gradient(135deg, #f8f9fa, #fff);
                border-bottom: 1px solid #eee;
            }

            .fp-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                font-size: 15px;
                color: #333;
            }

            .fp-title svg {
                width: 20px;
                height: 20px;
                fill: #0078d4;
            }

            .fp-close {
                width: 28px;
                height: 28px;
                border: none;
                background: transparent;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
            }

            .fp-close:hover {
                background: #fee;
            }

            .fp-close svg {
                width: 12px;
                height: 12px;
                stroke: #666;
            }

            .fp-toolbar {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
                background: #fafafa;
            }

            .fp-nav-btn {
                width: 28px;
                height: 28px;
                border: none;
                background: transparent;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
            }

            .fp-nav-btn:hover {
                background: rgba(0, 0, 0, 0.08);
            }

            .fp-nav-btn:disabled {
                opacity: 0.4;
                cursor: default;
            }

            .fp-nav-btn svg {
                width: 16px;
                height: 16px;
                fill: #555;
            }

            .fp-breadcrumb {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 4px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 13px;
                overflow-x: auto;
            }

            .fp-breadcrumb-item {
                color: #0078d4;
                cursor: pointer;
                white-space: nowrap;
            }

            .fp-breadcrumb-item:hover {
                text-decoration: underline;
            }

            .fp-breadcrumb-sep {
                color: #999;
                margin: 0 2px;
            }

            .fp-body {
                display: flex;
                flex: 1;
                min-height: 0;
                overflow: hidden;
            }

            .fp-sidebar {
                width: 200px;
                background: rgba(243, 243, 243, 0.6);
                border-right: 1px solid rgba(0, 0, 0, 0.05);
                padding: 10px;
                overflow-y: auto;
            }

            .fp-sidebar-title {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                color: #888;
                margin: 10px 0 5px 8px;
            }

            .fp-sidebar-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                color: #333;
                transition: background 0.15s;
            }

            .fp-sidebar-item:hover {
                background: rgba(0, 0, 0, 0.06);
            }

            .fp-sidebar-item.active {
                background: rgba(0, 120, 212, 0.12);
                color: #0078d4;
            }

            .fp-sidebar-item i.ph {
                font-size: 16px;
            }

            .fp-sidebar-item .icon-root { color: #e95420; }
            .fp-sidebar-item .icon-home { color: #0078d4; }
            .fp-sidebar-item .icon-documents { color: #e8b339; }
            .fp-sidebar-item .icon-downloads { color: #0078d4; }
            .fp-sidebar-item .icon-music { color: #1db954; }
            .fp-sidebar-item .icon-pictures { color: #d93025; }
            .fp-sidebar-item .icon-videos { color: #a142f4; }
            .fp-sidebar-item .icon-config { color: #666; }
            .fp-sidebar-item .icon-folder { color: #666; }
            .fp-sidebar-item .icon-tmp { color: #ff9800; }
            .fp-sidebar-item .icon-device { color: #555; }

            .fp-main {
                flex: 1;
                background: #fff;
                overflow-y: auto;
                padding: 12px;
            }

            .fp-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
                gap: 10px;
                padding-top: 10px;
            }

            .fp-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.1s;
                position: relative;
            }

            .fp-item:hover {
                background: rgba(243, 243, 243, 0.6);
            }

            .fp-item.selected {
                background: rgba(0, 120, 212, 0.15);
                outline: 1px solid rgba(0, 120, 212, 0.3);
            }

            .fp-item.disabled {
                opacity: 0.4;
                pointer-events: none;
            }

            .fp-item-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 5px;
            }

            .fp-item-icon i.ph {
                font-size: 40px;
            }

            .fp-item-name {
                font-size: 12px;
                text-align: center;
                word-break: break-word;
                line-height: 1.3;
                max-height: 2.6em;
                overflow: hidden;
            }

            .fp-item-check {
                position: absolute;
                top: 6px;
                left: 6px;
                width: 18px;
                height: 18px;
                border: 2px solid #0078d4;
                border-radius: 4px;
                background: #fff;
                display: none;
            }

            .fp-item.selected .fp-item-check {
                background: #0078d4;
            }

            .fp-item.selected .fp-item-check::after {
                content: '✓';
                color: #fff;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }

            .fp-multi .fp-item-check {
                display: flex;
            }

            .fp-empty {
                text-align: center;
                color: #888;
                padding: 40px;
                font-size: 14px;
            }

            .fp-footer {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-top: 1px solid #eee;
                background: #fafafa;
            }

            .fp-filename-group {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }

            .fp-filename-label {
                font-size: 13px;
                color: #555;
                white-space: nowrap;
            }

            .fp-filename-input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 13px;
                outline: none;
                transition: border-color 0.15s;
            }

            .fp-filename-input:focus {
                border-color: #0078d4;
            }

            .fp-selected-info {
                flex: 1;
                font-size: 13px;
                color: #666;
            }

            .fp-actions {
                display: flex;
                gap: 8px;
            }

            .fp-btn {
                padding: 8px 20px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .fp-btn-cancel {
                background: #f0f0f0;
                color: #333;
            }

            .fp-btn-cancel:hover {
                background: #e5e5e5;
            }

            .fp-btn-primary {
                background: #0078d4;
                color: #fff;
            }

            .fp-btn-primary:hover {
                background: #006abc;
            }

            .fp-btn-primary:disabled {
                background: #ccc;
                cursor: default;
            }

            /* File Icon Colors - matching Explorer */
            .fp-icon { font-size: 40px; }
            .fp-icon.fp-icon-folder { color: #fdd835; }
            .fp-icon.fp-icon-image { color: #888; }
            .fp-icon.fp-icon-audio { color: #888; }
            .fp-icon.fp-icon-video { color: #888; }
            .fp-icon.fp-icon-archive { color: #888; }
            .fp-icon.fp-icon-code { color: #64b5f6; }
            .fp-icon.fp-icon-config { color: #ffb74d; }
            .fp-icon.fp-icon-text { color: #90a4ae; }
            .fp-icon.fp-icon-pdf { color: #e53935; }
            .fp-icon.fp-icon-doc { color: #2196f3; }
            .fp-icon.fp-icon-xls { color: #4caf50; }
            .fp-icon.fp-icon-ppt { color: #ff7043; }
            .fp-icon.fp-icon-file { color: #888; }
        `;
        document.head.appendChild(style);
    }

    static getIcon(isFolder, filename = '') {
        if (isFolder) {
            return '<i class="ph ph-folder fp-icon fp-icon-folder"></i>';
        }
        const ext = filename.split('.').pop().toLowerCase();

        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            return '<i class="ph ph-image fp-icon fp-icon-image"></i>';
        }
        if (['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext)) {
            return '<i class="ph ph-music-notes fp-icon fp-icon-audio"></i>';
        }
        if (['mp4', 'mkv', 'avi', 'webm', 'mov', 'wmv'].includes(ext)) {
            return '<i class="ph ph-video fp-icon fp-icon-video"></i>';
        }
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
            return '<i class="ph ph-file-zip fp-icon fp-icon-archive"></i>';
        }
        if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
            return '<i class="ph ph-file-js fp-icon fp-icon-code"></i>';
        }
        if (['css', 'scss', 'sass', 'less'].includes(ext)) {
            return '<i class="ph ph-file-css fp-icon fp-icon-code"></i>';
        }
        if (['html', 'htm', 'xml'].includes(ext)) {
            return '<i class="ph ph-file-html fp-icon fp-icon-code"></i>';
        }
        if (['py', 'java', 'c', 'cpp', 'h', 'sh', 'rb', 'go', 'rs', 'php'].includes(ext)) {
            return '<i class="ph ph-file-code fp-icon fp-icon-code"></i>';
        }
        if (['json', 'yaml', 'yml', 'toml', 'env'].includes(ext)) {
            return '<i class="ph ph-file-code fp-icon fp-icon-config"></i>';
        }
        if (['txt', 'md', 'log', 'ini', 'conf', 'cfg'].includes(ext)) {
            return '<i class="ph ph-file-text fp-icon fp-icon-text"></i>';
        }
        if (['pdf'].includes(ext)) {
            return '<i class="ph ph-file-pdf fp-icon fp-icon-pdf"></i>';
        }
        if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
            return '<i class="ph ph-file-doc fp-icon fp-icon-doc"></i>';
        }
        if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
            return '<i class="ph ph-file-xls fp-icon fp-icon-xls"></i>';
        }
        if (['ppt', 'pptx', 'odp'].includes(ext)) {
            return '<i class="ph ph-file-ppt fp-icon fp-icon-ppt"></i>';
        }
        return '<i class="ph ph-file fp-icon fp-icon-file"></i>';
    }

    static async loadDirectory(path) {
        try {
            if (AuthService.isSessionActive()) {
                const result = await FileSystemService.list(path);
                if (result && result.items) {
                    console.log('[FilePickerDialog] Loaded from backend:', path, result.items.length, 'items');
                    return result.items.map(item => ({
                        name: item.name,
                        isFolder: item.isDirectory === true || item.type === 'directory',
                        size: item.size || 0
                    }));
                }
            }
        } catch (error) {
            console.error('[FilePickerDialog] Error loading directory:', error);
        }

        console.log('[FilePickerDialog] Using fallback virtual filesystem for:', path);

        return [
            { name: 'Documents', isFolder: true },
            { name: 'Downloads', isFolder: true },
            { name: 'Pictures', isFolder: true },
            { name: 'Music', isFolder: true },
            { name: 'Videos', isFolder: true }
        ];
    }

    static createDialogHTML(title, mode, filename = '') {
        const isMulti = mode === 'files';
        const isSave = mode === 'save';
        const isFolder = mode === 'folder';

        const buttonText = isSave ? 'Save' : isFolder ? 'Select Folder' : 'Select';

        return `
            <div class="fp-overlay">
                <div class="fp-dialog">
                    <div class="fp-header">
                        <div class="fp-title">
                            <i class="ph ph-folder"></i>
                            ${title}
                        </div>
                        <button class="fp-close" id="fp-close-btn">
                            <i class="ph ph-x"></i>
                        </button>
                    </div>
                    <div class="fp-toolbar">
                        <button class="fp-nav-btn" id="fp-back-btn" title="Back">
                            <i class="ph ph-arrow-left"></i>
                        </button>
                        <button class="fp-nav-btn" id="fp-up-btn" title="Up">
                            <i class="ph ph-arrow-up"></i>
                        </button>
                        <div class="fp-breadcrumb" id="fp-breadcrumb"></div>
                    </div>
                    <div class="fp-body">
                        <div class="fp-sidebar">
                            <div class="fp-sidebar-title">Favorites</div>
                            <div class="fp-sidebar-item" data-path="/">
                                <i class="ph ph-folder icon-root"></i>
                                Root (/)
                            </div>
                            <div class="fp-sidebar-item" data-path="/home">
                                <i class="ph ph-house icon-home"></i>
                                Home
                            </div>
                            <div class="fp-sidebar-item" data-path="/home/user/Documents">
                                <i class="ph ph-file-text icon-documents"></i>
                                Documents
                            </div>
                            <div class="fp-sidebar-item" data-path="/home/user/Downloads">
                                <i class="ph ph-download-simple icon-downloads"></i>
                                Downloads
                            </div>
                            <div class="fp-sidebar-item" data-path="/home/user/Music">
                                <i class="ph ph-music-notes icon-music"></i>
                                Music
                            </div>
                            <div class="fp-sidebar-item" data-path="/home/user/Pictures">
                                <i class="ph ph-image icon-pictures"></i>
                                Pictures
                            </div>
                            <div class="fp-sidebar-item" data-path="/home/user/Videos">
                                <i class="ph ph-video icon-videos"></i>
                                Videos
                            </div>
                            <div class="fp-sidebar-title" style="margin-top:15px;">System</div>
                            <div class="fp-sidebar-item" data-path="/etc">
                                <i class="ph ph-gear icon-config"></i>
                                etc (Config)
                            </div>
                            <div class="fp-sidebar-item" data-path="/var">
                                <i class="ph ph-folder icon-folder"></i>
                                var
                            </div>
                            <div class="fp-sidebar-item" data-path="/tmp">
                                <i class="ph ph-folder icon-tmp"></i>
                                tmp
                            </div>
                            <div class="fp-sidebar-title" style="margin-top:15px;">Devices</div>
                            <div class="fp-sidebar-item" data-path="/mnt">
                                <i class="ph ph-hard-drive icon-device"></i>
                                Mounts
                            </div>
                        </div>
                        <div class="fp-main ${isMulti ? 'fp-multi' : ''}" id="fp-main">
                            <div class="fp-grid" id="fp-grid"></div>
                        </div>
                    </div>
                    <div class="fp-footer">
                        ${isSave ? `
                            <div class="fp-filename-group">
                                <span class="fp-filename-label">File name:</span>
                                <input type="text" class="fp-filename-input" id="fp-filename" value="${filename}" placeholder="Enter filename...">
                            </div>
                        ` : `
                            <div class="fp-selected-info" id="fp-selected-info">
                                ${isFolder ? 'Select a folder' : 'Select a file'}
                            </div>
                        `}
                        <div class="fp-actions">
                            <button class="fp-btn fp-btn-cancel" id="fp-cancel-btn">Cancel</button>
                            <button class="fp-btn fp-btn-primary" id="fp-select-btn" ${!isSave ? 'disabled' : ''}>${buttonText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static updateBreadcrumb() {
        const breadcrumb = document.getElementById('fp-breadcrumb');
        if (!breadcrumb) return;

        const parts = this.currentPath.split('/').filter(Boolean);
        let html = `<span class="fp-breadcrumb-item" data-path="/">/</span>`;

        let accPath = '';
        parts.forEach((part, i) => {
            accPath += '/' + part;
            html += `<span class="fp-breadcrumb-sep">›</span>`;
            html += `<span class="fp-breadcrumb-item" data-path="${accPath}">${part}</span>`;
        });

        breadcrumb.innerHTML = html;


        breadcrumb.querySelectorAll('.fp-breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.path);
            });
        });
    }

    static async renderGrid() {
        const grid = document.getElementById('fp-grid');
        if (!grid) return;

        grid.innerHTML = '<div class="fp-empty">Loading...</div>';

        const items = await this.loadDirectory(this.currentPath);

        if (!items || items.length === 0) {
            grid.innerHTML = '<div class="fp-empty">This folder is empty</div>';
            return;
        }

        items.sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name);
        });

        const filtered = this.showHidden ? items : items.filter(i => !i.name.startsWith('.'));

        grid.innerHTML = filtered.map(item => {
            const isDisabled = this.isItemDisabled(item);
            return `
                <div class="fp-item ${isDisabled ? 'disabled' : ''}" 
                     data-name="${item.name}" 
                     data-folder="${item.isFolder}">
                    <div class="fp-item-check"></div>
                    <div class="fp-item-icon">${this.getIcon(item.isFolder, item.name)}</div>
                    <div class="fp-item-name">${item.name}</div>
                </div>
            `;
        }).join('');

        this.attachGridListeners();
    }

    static isItemDisabled(item) {
        if (item.isFolder) {
            return false;
        }

        if (this.mode === 'folder') {
            return true;
        }

        if (this.filters.length === 0) {
            return false;
        }

        const ext = '.' + item.name.split('.').pop().toLowerCase();
        return !this.filters.some(f => f.toLowerCase() === ext);
    }

    static attachGridListeners() {
        const grid = document.getElementById('fp-grid');
        if (!grid) return;

        grid.querySelectorAll('.fp-item:not(.disabled)').forEach(item => {

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleItemClick(item);
            });


            item.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.handleItemDblClick(item);
            });
        });
    }

    static handleItemClick(item) {
        const name = item.dataset.name;
        const isFolder = item.dataset.folder === 'true';


        if (isFolder && (this.mode === 'save' || this.mode === 'folder')) {
            const newPath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
            this.navigateTo(newPath);
            return;
        }

        if (this.mode === 'files') {

            item.classList.toggle('selected');
            this.selectedItems = Array.from(document.querySelectorAll('.fp-item.selected'))
                .map(el => ({
                    name: el.dataset.name,
                    isFolder: el.dataset.folder === 'true'
                }));
        } else {

            document.querySelectorAll('.fp-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            this.selectedItems = [{ name, isFolder }];
        }

        this.updateSelectedInfo();
        this.updateSelectButton();
    }

    static handleItemDblClick(item) {
        const name = item.dataset.name;
        const isFolder = item.dataset.folder === 'true';

        if (isFolder) {
            const newPath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
            this.navigateTo(newPath);
        } else if (this.mode === 'file' || this.mode === 'files') {

            this.selectedItems = [{ name, isFolder: false }];
            this.confirmSelection();
        }
    }

    static navigateTo(path) {
        this.currentPath = path;
        this.selectedItems = [];
        this.updateBreadcrumb();
        this.renderGrid();
        this.updateSelectedInfo();
        this.updateSelectButton();
        this.updateSidebarActive();
    }

    static updateSidebarActive() {
        document.querySelectorAll('.fp-sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.path === this.currentPath);
        });
    }

    static updateSelectedInfo() {
        const info = document.getElementById('fp-selected-info');
        if (!info) return;

        if (this.selectedItems.length === 0) {
            info.textContent = this.mode === 'folder' ? 'Select a folder' : 'Select a file';
        } else if (this.selectedItems.length === 1) {
            info.textContent = this.selectedItems[0].name;
        } else {
            info.textContent = `${this.selectedItems.length} items selected`;
        }
    }

    static updateSelectButton() {
        const btn = document.getElementById('fp-select-btn');
        if (!btn) return;

        if (this.mode === 'save') {
            const input = document.getElementById('fp-filename');
            btn.disabled = !input || !input.value.trim();
        } else if (this.mode === 'folder') {

            btn.disabled = false;
        } else {

            const hasFiles = this.selectedItems.some(i => !i.isFolder);
            btn.disabled = !hasFiles;
        }
    }

    static confirmSelection() {

        const input = document.getElementById('fp-filename');
        const filename = input ? input.value.trim() : '';


        const overlay = document.querySelector('.fp-overlay');
        if (overlay) overlay.remove();

        console.log('[FilePickerDialog] confirmSelection - mode:', this.mode, 'filename:', filename, 'path:', this.currentPath);

        if (this.mode === 'save') {
            if (filename && this.resolvePromise) {
                const result = {
                    path: this.currentPath,
                    filename: filename,
                    fullPath: this.currentPath === '/' ? `/${filename}` : `${this.currentPath}/${filename}`
                };
                console.log('[FilePickerDialog] Resolving save with:', result);
                this.resolvePromise(result);
            } else {
                console.log('[FilePickerDialog] Save cancelled - no filename');
                if (this.resolvePromise) this.resolvePromise(null);
            }
        } else if (this.mode === 'folder') {
            if (this.resolvePromise) {
                this.resolvePromise(this.currentPath);
            }
        } else if (this.mode === 'files') {
            const paths = this.selectedItems
                .filter(i => !i.isFolder)
                .map(i => this.currentPath === '/' ? `/${i.name}` : `${this.currentPath}/${i.name}`);
            if (this.resolvePromise) {
                this.resolvePromise(paths);
            }
        } else {
            const selected = this.selectedItems.find(i => !i.isFolder);
            if (selected && this.resolvePromise) {
                const fullPath = this.currentPath === '/' ? `/${selected.name}` : `${this.currentPath}/${selected.name}`;
                this.resolvePromise(fullPath);
            }
        }

        this.resolvePromise = null;
    }

    static cancelSelection() {
        const overlay = document.querySelector('.fp-overlay');
        if (overlay) overlay.remove();

        if (this.resolvePromise) {
            this.resolvePromise(null);
            this.resolvePromise = null;
        }
    }

    static attachDialogListeners() {

        document.getElementById('fp-close-btn')?.addEventListener('click', () => this.cancelSelection());
        document.getElementById('fp-cancel-btn')?.addEventListener('click', () => this.cancelSelection());


        document.getElementById('fp-select-btn')?.addEventListener('click', () => this.confirmSelection());


        document.getElementById('fp-back-btn')?.addEventListener('click', () => {

            this.goUp();
        });

        document.getElementById('fp-up-btn')?.addEventListener('click', () => {
            this.goUp();
        });


        document.querySelectorAll('.fp-sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.path);
            });
        });


        const filenameInput = document.getElementById('fp-filename');
        if (filenameInput) {
            filenameInput.addEventListener('input', () => this.updateSelectButton());
            filenameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.confirmSelection();
            });
        }


        document.querySelector('.fp-overlay')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('fp-overlay')) {
                this.cancelSelection();
            }
        });


        document.addEventListener('keydown', this.handleKeydown);
    }

    static handleKeydown = (e) => {
        if (e.key === 'Escape') {
            this.cancelSelection();
            document.removeEventListener('keydown', this.handleKeydown);
        }
    }

    static goUp() {
        if (this.currentPath === '/') return;
        const parts = this.currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
        this.navigateTo(newPath);
    }

    static async showDialog(options = {}) {
        this.init();

        const {
            title = 'Select File',
            startPath = '/home/user',
            filters = [],
            mode = 'file',
            filename = ''
        } = options;

        this.currentPath = startPath;
        this.selectedItems = [];
        this.mode = mode;
        this.filters = filters;


        document.querySelector('.fp-overlay')?.remove();


        this.dialogContainer.innerHTML = this.createDialogHTML(title, mode, filename);


        this.attachDialogListeners();


        this.updateBreadcrumb();
        this.updateSidebarActive();
        await this.renderGrid();


        if (mode === 'save') {
            setTimeout(() => document.getElementById('fp-filename')?.focus(), 100);
        }


        return new Promise(resolve => {
            this.resolvePromise = resolve;
        });
    }

    static async pickFile(options = {}) {
        return this.showDialog({
            title: options.title || 'Open File',
            startPath: options.startPath || '/home/user',
            filters: options.filters || [],
            mode: 'file'
        });
    }

    static async pickFiles(options = {}) {
        return this.showDialog({
            title: options.title || 'Select Files',
            startPath: options.startPath || '/home/user',
            filters: options.filters || [],
            mode: 'files'
        });
    }

    static async pickFolder(options = {}) {
        return this.showDialog({
            title: options.title || 'Select Folder',
            startPath: options.startPath || '/home/user',
            mode: 'folder'
        });
    }

    static async saveAs(defaultFilename = '', options = {}) {
        return this.showDialog({
            title: options.title || 'Save As',
            startPath: options.startPath || '/home/user',
            mode: 'save',
            filename: defaultFilename
        });
    }
}
