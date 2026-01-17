import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';
import { FileSystem } from '../../system/lib/FileSystem.js';
import { ExplorerService } from '../../system/lib/ExplorerService.js';
import { AuthService } from '../../system/lib/AuthService.js';

export class Explorer {
    static currentPath = '/';
    static contextTarget = null;
    static viewMode = 'grid';
    static showHidden = false;
    static clipboard = null;
    static clipboardAction = null;
    static useBackend = true;

    static instances = new Map();

    static createNewInstance(options = {}) {
        const { startPath = '/home/user' } = options;
        const icon = '<i class="ph ph-folder icon-folder-blue"></i>';
        const windowContent = this.getWindowContent();

        const windowId = WindowManager.createWindow('explorer', {
            title: 'File Manager',
            width: 800,
            height: 500,
            content: windowContent,
            icon: icon
        });

        this.instances.set(windowId, {
            currentPath: startPath,
            viewMode: 'grid',
            showHidden: false,
            clipboard: null,
            clipboardAction: null,
            lastSelectedIndex: undefined
        });

        this.initInstance(windowId, startPath);
        console.log(`[Explorer] Created new instance: ${windowId}`);
        return windowId;
    }

    static getWindowContent() {
        return `
            <div class="explorer-toolbar">
                <div class="menu-item-container">
                    <button class="menu-btn exp-menu-file">File</button>
                    <div class="dropdown-menu exp-file-menu">
                        <div class="dropdown-item" data-action="new-folder"><i class="ph ph-folder-plus"></i>New Folder</div>
                        <div class="dropdown-item" data-action="new-file"><i class="ph ph-file-plus"></i>New Text File</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-action="compress"><i class="ph ph-file-zip"></i>Compress (Zip)</div>
                        <div class="dropdown-item" data-action="extract"><i class="ph ph-file-arrow-down"></i>Extract (Unzip)</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-action="close"><i class="ph ph-x"></i>Close</div>
                    </div>
                </div>
                <div class="menu-item-container">
                    <button class="menu-btn exp-menu-edit">Edit</button>
                    <div class="dropdown-menu exp-edit-menu">
                        <div class="dropdown-item" data-action="cut"><i class="ph ph-scissors"></i>Cut<span class="dropdown-shortcut">Ctrl+X</span></div>
                        <div class="dropdown-item" data-action="copy"><i class="ph ph-copy"></i>Copy<span class="dropdown-shortcut">Ctrl+C</span></div>
                        <div class="dropdown-item" data-action="paste"><i class="ph ph-clipboard"></i>Paste<span class="dropdown-shortcut">Ctrl+V</span></div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-action="select-all"><i class="ph ph-selection-all"></i>Select All<span class="dropdown-shortcut">Ctrl+A</span></div>
                        <div class="dropdown-item item-delete" data-action="delete"><i class="ph ph-trash icon-delete"></i>Delete</div>
                    </div>
                </div>
                <div class="menu-item-container">
                    <button class="menu-btn exp-menu-view">View</button>
                    <div class="dropdown-menu exp-view-menu">
                        <div class="dropdown-item active" data-action="view-grid"><i class="ph ph-grid-four"></i>Grid View</div>
                        <div class="dropdown-item" data-action="view-list"><i class="ph ph-list"></i>List View</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-action="toggle-hidden"><i class="ph ph-eye"></i>Show Hidden Files</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-action="refresh"><i class="ph ph-arrows-clockwise"></i>Refresh</div>
                    </div>
                </div>
                <div class="menu-item-container">
                    <button class="menu-btn exp-menu-go">Go</button>
                    <div class="dropdown-menu exp-go-menu">
                        <div class="dropdown-item" data-path="/"><i class="ph ph-folder icon-root"></i>Root (/)</div>
                        <div class="dropdown-item" data-path="/home"><i class="ph ph-house icon-home"></i>Home</div>
                        <div class="dropdown-item" data-path="/home/user/Documents"><i class="ph ph-file-text icon-documents"></i>Documents</div>
                        <div class="dropdown-item" data-path="/home/user/Downloads"><i class="ph ph-download-simple icon-downloads"></i>Downloads</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-path="/etc"><i class="ph ph-gear icon-config"></i>etc (Config)</div>
                        <div class="dropdown-item" data-path="/var"><i class="ph ph-folder icon-folder"></i>var</div>
                        <div class="dropdown-item" data-path="/tmp"><i class="ph ph-folder icon-tmp"></i>tmp</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" data-path="/mnt"><i class="ph ph-hard-drive icon-device"></i>Mounts</div>
                    </div>
                </div>
                <div class="toolbar-divider"></div>
                <div class="breadcrumb-container">
                    <div class="go-up-btn">
                        <i class="ph ph-caret-left"></i>
                    </div>
                    <div class="exp-breadcrumb-path"></div>
                    <div class="copy-path-btn" title="Copy Path">
                        <i class="ph ph-copy"></i>
                    </div>
                </div>
            </div>
            <div class="explorer-body">
                <div class="sidebar exp-sidebar">
                    <div class="sidebar-section-title">Favorites</div>
                    <div class="sidebar-item" data-path="/"><i class="ph ph-folder icon icon-root"></i>Root (/)</div>
                    <div class="sidebar-item" data-path="/home"><i class="ph ph-house icon icon-home"></i>Home</div>
                    <div class="sidebar-item" data-path="/home/user/Documents"><i class="ph ph-file-text icon icon-documents"></i>Documents</div>
                    <div class="sidebar-item" data-path="/home/user/Downloads"><i class="ph ph-download-simple icon icon-downloads"></i>Downloads</div>
                    <div class="sidebar-item" data-path="/home/user/Music"><i class="ph ph-music-notes icon icon-music"></i>Music</div>
                    <div class="sidebar-item" data-path="/home/user/Pictures"><i class="ph ph-image icon icon-pictures"></i>Pictures</div>
                    <div class="sidebar-item" data-path="/home/user/Videos"><i class="ph ph-video icon icon-videos"></i>Videos</div>
                    
                    <div class="sidebar-section-title section-top">System</div>
                    <div class="sidebar-item" data-path="/etc"><i class="ph ph-gear icon icon-config"></i>etc (Config)</div>
                    <div class="sidebar-item" data-path="/var"><i class="ph ph-folder icon icon-folder"></i>var</div>
                    <div class="sidebar-item" data-path="/tmp"><i class="ph ph-folder icon icon-tmp"></i>tmp</div>
                    
                    <div class="sidebar-section-title section-top">Devices</div>
                    <div class="sidebar-item" data-path="/mnt"><i class="ph ph-hard-drive icon icon-device"></i>Mounts</div>
                    <div class="sidebar-item" data-path="/dev"><i class="ph ph-devices icon icon-device"></i>Devices</div>
                    
                    <div class="sidebar-section-title section-top">Network</div>
                    <div class="sidebar-item" data-path="/net"><i class="ph ph-cloud icon icon-network"></i>Network</div>
                    <div class="sidebar-item add-network-btn"><i class="ph ph-plus icon icon-network"></i>Add Network...</div>
                </div>
                <div class="main-content exp-main-content">
                    <div class="grid-files exp-file-grid"></div>
                </div>
            </div>
            
            <div class="exp-context-menu exp-context-file dropdown-menu">
                <div class="dropdown-item" data-action="open"><i class="ph ph-folder-open"></i>Open</div>
                <div class="dropdown-item" data-action="open-with"><i class="ph ph-arrow-square-out"></i>Open With...</div>
                <div class="dropdown-item" data-action="open-terminal"><i class="ph ph-terminal-window"></i>Open in Terminal</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="cut"><i class="ph ph-scissors"></i>Cut</div>
                <div class="dropdown-item" data-action="copy"><i class="ph ph-copy"></i>Copy</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="rename"><i class="ph ph-pencil"></i>Rename</div>
                <div class="dropdown-item item-delete" data-action="delete"><i class="ph ph-trash icon-delete"></i>Delete</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="properties"><i class="ph ph-info"></i>Properties</div>
            </div>
            
            <div class="exp-context-menu exp-context-empty dropdown-menu">
                <div class="dropdown-item" data-action="new-folder"><i class="ph ph-folder-plus"></i>New Folder</div>
                <div class="dropdown-item" data-action="new-file"><i class="ph ph-file-plus"></i>New Text File</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="paste"><i class="ph ph-clipboard"></i>Paste</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="open-terminal"><i class="ph ph-terminal-window"></i>Open Terminal Here</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="refresh"><i class="ph ph-arrows-clockwise"></i>Refresh</div>
                <div class="dropdown-item" data-action="select-all"><i class="ph ph-selection-all"></i>Select All</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="folder-properties"><i class="ph ph-info"></i>Properties</div>
            </div>
            
            <div class="exp-context-menu exp-context-sidebar dropdown-menu">
                <div class="dropdown-item" data-action="open-location"><i class="ph ph-folder-open"></i>Open</div>
                <div class="dropdown-item" data-action="open-new-window"><i class="ph ph-arrow-square-out"></i>Open in New Window</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="remove-from-sidebar"><i class="ph ph-minus"></i>Remove from Sidebar</div>
            </div>
        `;
    }

    static initInstance(windowId, startPath) {
        const win = document.getElementById(windowId);
        if (!win) return;
        const state = this.instances.get(windowId);

        win.querySelector('.exp-menu-file')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeInstanceMenus(windowId);
            win.querySelector('.exp-file-menu').classList.add('show');
        });

        win.querySelector('.exp-menu-edit')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeInstanceMenus(windowId);
            win.querySelector('.exp-edit-menu').classList.add('show');
        });

        win.querySelector('.exp-menu-view')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeInstanceMenus(windowId);
            win.querySelector('.exp-view-menu').classList.add('show');
        });

        win.querySelector('.exp-menu-go')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeInstanceMenus(windowId);
            win.querySelector('.exp-go-menu').classList.add('show');
        });

        win.querySelectorAll('.explorer-toolbar .dropdown-item[data-action]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleInstanceAction(windowId, item.dataset.action);
                this.closeInstanceMenus(windowId);
            });
        });

        win.querySelectorAll('.exp-go-menu .dropdown-item[data-path]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeInstanceMenus(windowId);
                this.navigateInstanceTo(windowId, item.dataset.path);
            });
        });

        win.querySelectorAll('.exp-sidebar .sidebar-item[data-path]').forEach(item => {
            item.addEventListener('click', () => this.navigateInstanceTo(windowId, item.dataset.path));
        });

        win.querySelector('.go-up-btn')?.addEventListener('click', () => this.goUpInstance(windowId));

        win.querySelector('.copy-path-btn')?.addEventListener('click', async () => {
            const state = this.instances.get(windowId);
            if (state) {
                try {
                    await navigator.clipboard.writeText(state.currentPath);
                    const btn = win.querySelector('.copy-path-btn');
                    btn.style.opacity = '1';
                    btn.title = 'Copied!';
                    setTimeout(() => {
                        btn.style.opacity = '0.6';
                        btn.title = 'Copy Path';
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy path:', err);
                }
            }
        });

        win.addEventListener('click', () => this.closeInstanceMenus(windowId));

        win.querySelector('.exp-main-content')?.addEventListener('click', (e) => {
            if (!e.target.closest('.file-item')) {
                const state = this.instances.get(windowId);
                win.querySelectorAll('.file-item.selected').forEach(i => i.classList.remove('selected'));
                if (state) state.lastSelectedIndex = undefined;
            }
        });

        win.querySelector('.exp-main-content')?.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.file-item')) return;
            e.preventDefault();
            e.stopPropagation();
            this.showInstanceContextMenu(windowId, e, null);
        });

        win.querySelector('.add-network-btn')?.addEventListener('click', () => {
            this.showAddNetworkDialog(windowId);
        });

        win.querySelectorAll('.exp-sidebar .sidebar-item[data-path]').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const path = item.dataset.path;
                this.showInstanceContextMenu(windowId, e, { name: path.split('/').pop() || 'Root', isFolder: true, path: path }, 'sidebar');
            });
        });

        win.querySelectorAll('.exp-context-menu .dropdown-item[data-action]').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = item.dataset.action;
                this.hideInstanceContextMenus(windowId);
                await this.handleContextAction(windowId, action);
            });
        });

        win.addEventListener('click', (e) => {
            if (!e.target.closest('.exp-context-menu')) {
                this.hideInstanceContextMenus(windowId);
            }
        });

        this.navigateInstanceTo(windowId, startPath);
    }

    static closeInstanceMenus(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;
        win.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        win.querySelectorAll('.exp-context-menu').forEach(m => {
            m.style.display = 'none';
            m.classList.remove('show');
        });
    }

    static async handleInstanceAction(windowId, action) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const win = document.getElementById(windowId);
        if (!win) return;

        switch (action) {
            case 'new-folder': {
                const { DialogService } = await import('../../system/lib/DialogService.js');
                const fname = await DialogService.prompt('Folder name:', 'New Folder', { title: 'New Folder' });
                if (fname) {
                    const folderPath = state.currentPath === '/' ? `/${fname}` : `${state.currentPath}/${fname}`;
                    const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                    const success = await FileSystemService.mkdir(folderPath);
                    if (success) {
                        this.navigateInstanceTo(windowId, state.currentPath);
                    }
                }
                break;
            }
            case 'new-file': {
                const { DialogService } = await import('../../system/lib/DialogService.js');
                const txtname = await DialogService.prompt('File name:', 'New File.txt', { title: 'New Text File' });
                if (txtname) {
                    const filePath = state.currentPath === '/' ? `/${txtname}` : `${state.currentPath}/${txtname}`;
                    const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                    const success = await FileSystemService.write(filePath, '');
                    if (success) {
                        this.navigateInstanceTo(windowId, state.currentPath);
                    }
                }
                break;
            }
            case 'close':
                WindowManager.closeWindow(windowId, 'explorer');
                this.instances.delete(windowId);
                break;
            case 'cut':
            case 'copy':
            case 'paste':
            case 'select-all':
            case 'delete':
                console.log('[Explorer Instance] Action:', action);
                break;
            case 'view-grid':
                state.viewMode = 'grid';
                win.querySelector('[data-action="view-grid"]').classList.add('active');
                win.querySelector('[data-action="view-list"]').classList.remove('active');
                this.navigateInstanceTo(windowId, state.currentPath);
                break;
            case 'view-list':
                state.viewMode = 'list';
                win.querySelector('[data-action="view-grid"]').classList.remove('active');
                win.querySelector('[data-action="view-list"]').classList.add('active');
                this.navigateInstanceTo(windowId, state.currentPath);
                break;
            case 'toggle-hidden':
                state.showHidden = !state.showHidden;
                const hiddenItem = win.querySelector('[data-action="toggle-hidden"]');
                if (state.showHidden) {
                    hiddenItem.classList.add('active');
                } else {
                    hiddenItem.classList.remove('active');
                }
                this.navigateInstanceTo(windowId, state.currentPath);
                break;
            case 'refresh':
                this.navigateInstanceTo(windowId, state.currentPath);
                break;
            case 'compress':
            case 'extract':
                console.log('[Explorer Instance] Compress/Extract action');
                break;
        }
    }

    static async navigateInstanceTo(windowId, path) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const win = document.getElementById(windowId);
        if (!win) return;

        state.currentPath = path;
        state.lastSelectedIndex = undefined;
        const grid = win.querySelector('.exp-file-grid');
        grid.innerHTML = '<div class="file-grid-status loading">Loading...</div>';

        let content = null;

        if (this.useBackend && AuthService.isSessionActive()) {
            try {
                content = await ExplorerService.resolvePath(path);
            } catch (error) {
                console.warn('[Explorer] Backend error:', error);
            }
        }

        if (!content) {
            content = FileSystem.resolvePath(path);
        }

        if (!content) {
            grid.innerHTML = '<div class="file-grid-status error">Path not found</div>';
            return;
        }

        this.renderInstanceFiles(windowId, content);
        this.updateInstanceBreadcrumb(windowId, path);
    }

    static goUpInstance(windowId) {
        const state = this.instances.get(windowId);
        if (!state || state.currentPath === '/') return;
        const parts = state.currentPath.split('/').filter(p => p);
        parts.pop();
        this.navigateInstanceTo(windowId, '/' + parts.join('/') || '/');
    }

    static renderInstanceFiles(windowId, content) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const win = document.getElementById(windowId);
        if (!win) return;

        const grid = win.querySelector('.exp-file-grid');
        grid.innerHTML = '';
        grid.className = state.viewMode === 'list' ? 'grid-files list-view exp-file-grid' : 'grid-files exp-file-grid';

        const entries = Object.entries(content).filter(([name]) => {
            if (!state.showHidden && name.startsWith('.')) return false;
            return true;
        });

        if (entries.length === 0) {
            grid.innerHTML = '<div class="file-grid-status empty">Folder is empty</div>';
            return;
        }

        const cachedItems = ExplorerService.getCachedItems(state.currentPath);
        const itemsMap = new Map();
        if (cachedItems) {
            cachedItems.forEach(item => itemsMap.set(item.name, item));
        }

        if (state.viewMode === 'list') {
            const header = document.createElement('div');
            header.className = 'file-list-header';
            header.innerHTML = `
                <span class="col-name">Name</span>
                <span class="col-perm">Permissions</span>
                <span class="col-owner">Owner</span>
                <span class="col-type">Type</span>
                <span class="col-date">Date Modified</span>
                <span class="col-size">Size</span>
            `;
            grid.appendChild(header);
        }

        for (const [name, type] of entries) {
            const isFolder = typeof type === 'object';
            const el = document.createElement('div');
            el.className = 'file-item';

            const itemMeta = itemsMap.get(name);
            const fileInfo = this.getFileInfoForInstance(name, type, isFolder, itemMeta);

            if (state.viewMode === 'list') {
                el.innerHTML = `
                    <div class="file-main">
                        ${isFolder ? this.getFolderIcon() : this.getFileIcon(name)}
                        <span class="file-name">${name}</span>
                    </div>
                    <span class="col-perm">${fileInfo.permissions}</span>
                    <span class="col-owner">${fileInfo.owner}</span>
                    <span class="col-type">${fileInfo.type}</span>
                    <span class="col-date">${fileInfo.date}</span>
                    <span class="col-size">${isFolder ? '-' : fileInfo.size}</span>
                `;
            } else {
                el.innerHTML = `
                    ${isFolder ? this.getFolderIcon() : this.getFileIcon(name)}
                    <span class="file-name">${name}</span>
                `;
            }

            el.ondblclick = () => {
                if (isFolder) {
                    this.navigateInstanceTo(windowId, state.currentPath === '/' ? `/${name}` : `${state.currentPath}/${name}`);
                } else {
                    this.openInstanceFile(windowId, name);
                }
            };

            el.onclick = (e) => {
                e.stopPropagation();
                const allItems = Array.from(win.querySelectorAll('.file-item'));
                const currentIndex = allItems.indexOf(el);

                if (e.ctrlKey) {
                    el.classList.toggle('selected');
                    state.lastSelectedIndex = currentIndex;
                } else if (e.shiftKey && state.lastSelectedIndex !== undefined) {
                    const start = Math.min(state.lastSelectedIndex, currentIndex);
                    const end = Math.max(state.lastSelectedIndex, currentIndex);
                    allItems.forEach(i => i.classList.remove('selected'));
                    for (let i = start; i <= end; i++) {
                        allItems[i].classList.add('selected');
                    }
                } else {
                    allItems.forEach(i => i.classList.remove('selected'));
                    el.classList.add('selected');
                    state.lastSelectedIndex = currentIndex;
                }
            };

            el.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showInstanceContextMenu(windowId, e, { name, isFolder });
            };

            grid.appendChild(el);
        }
    }

    static async openInstanceFile(windowId, filename) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const ext = filename.split('.').pop().toLowerCase();
        const textExts = ['txt', 'md', 'js', 'css', 'html', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'h', 'sh', 'conf', 'cfg', 'ini', 'log'];
        const fullPath = state.currentPath === '/' ? `/${filename}` : `${state.currentPath}/${filename}`;

        if (textExts.includes(ext)) {
            const { TextEditor } = await import('../TextEditor/TextEditor.js');
            const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
            try {
                const result = await FileSystemService.read(fullPath);
                TextEditor.createNewInstance({
                    fileName: filename,
                    filePath: fullPath,
                    content: result?.content || ''
                });
            } catch (error) {
                TextEditor.createNewInstance({ fileName: filename, filePath: fullPath, content: '' });
            }
        } else {
            WindowManager.toggleWindow('media-app');
        }
    }

    static getFileInfoForInstance(name, type, isFolder, itemMeta = null) {
        const ext = name.split('.').pop().toLowerCase();

        const types = {
            folder: 'Folder',
            txt: 'Text Document',
            md: 'Markdown',
            js: 'JavaScript',
            css: 'Stylesheet',
            html: 'HTML Document',
            json: 'JSON Data',
            xml: 'XML Document',
            py: 'Python Script',
            java: 'Java Source',
            c: 'C Source',
            cpp: 'C++ Source',
            h: 'C Header',
            sh: 'Shell Script',
            conf: 'Config File',
            cfg: 'Config File',
            ini: 'INI File',
            log: 'Log File',
            mp3: 'Audio File',
            mp4: 'Video File',
            jpg: 'JPEG Image',
            jpeg: 'JPEG Image',
            png: 'PNG Image',
            gif: 'GIF Image',
            svg: 'SVG Image',
            zip: 'ZIP Archive',
            tar: 'TAR Archive',
            gz: 'GZip Archive'
        };

        if (itemMeta) {
            return {
                permissions: itemMeta.permissions || (isFolder ? 'drwxr-xr-x' : '-rw-r--r--'),
                owner: itemMeta.owner || 'user',
                type: isFolder ? 'Folder' : (types[ext] || 'File'),
                date: itemMeta.modifiedFormatted || itemMeta.modified || 'Unknown',
                size: itemMeta.sizeFormatted || this.formatSize(itemMeta.size) || '-'
            };
        }

        const owners = ['root', 'user', 'www-data', 'admin'];
        const randomOwner = owners[Math.floor(Math.random() * owners.length)];

        const now = new Date();
        const randomDays = Math.floor(Math.random() * 30);
        const modDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
        const dateStr = modDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const sizes = ['128 B', '256 B', '512 B', '1 KB', '2 KB', '4 KB', '8 KB', '16 KB', '32 KB', '64 KB', '128 KB', '256 KB', '1 MB', '2 MB'];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];

        const permissions = isFolder ? 'drwxr-xr-x' : '-rw-r--r--';

        return {
            permissions: permissions,
            owner: randomOwner,
            type: isFolder ? 'Folder' : (types[ext] || 'File'),
            date: dateStr,
            size: randomSize
        };
    }

    static formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + units[i];
    }

    static showAddNetworkDialog(windowId) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-window glass" style="width: 420px;">
                <div class="window-header">
                    <div class="title-drag-area">
                        <svg viewBox="0 0 24 24" class="dialog-header-icon">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                        </svg>
                        Connect to Server
                    </div>
                </div>
                <div class="dialog-body">
                    <div class="form-row">
                        <label>Protocol</label>
                        <select class="form-input" id="net-protocol">
                            <option value="ftp">FTP - File Transfer Protocol</option>
                            <option value="sftp">SFTP - SSH File Transfer</option>
                            <option value="smb">SMB - Windows Share</option>
                            <option value="nfs">NFS - Network File System</option>
                            <option value="webdav">WebDAV - Web-based</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>Server Address</label>
                        <input type="text" class="form-input" id="net-server" placeholder="e.g. 192.168.1.100 or ftp.example.com">
                    </div>
                    <div class="form-row-group">
                        <div class="form-row">
                            <label>Port</label>
                            <input type="text" class="form-input" id="net-port" placeholder="21">
                        </div>
                        <div class="form-row">
                            <label>Share/Path (optional)</label>
                            <input type="text" class="form-input" id="net-share" placeholder="/share">
                        </div>
                    </div>
                    <div class="form-row-group">
                        <div class="form-row">
                            <label>Username</label>
                            <input type="text" class="form-input" id="net-user" placeholder="anonymous">
                        </div>
                        <div class="form-row">
                            <label>Password</label>
                            <input type="password" class="form-input" id="net-pass" placeholder="••••••••">
                        </div>
                    </div>
                    <div class="form-row">
                            <label class="form-checkbox-label">
                            <input type="checkbox" id="net-remember">
                            <span>Remember this connection</span>
                        </label>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn" id="net-cancel">Cancel</button>
                    <button class="dialog-btn primary" id="net-connect">
                        <svg viewBox="0 0 24 24" class="dialog-header-icon">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                        </svg>
                        Connect
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const protocolSelect = overlay.querySelector('#net-protocol');
        const portInput = overlay.querySelector('#net-port');
        const defaultPorts = { ftp: '21', sftp: '22', smb: '445', nfs: '2049', webdav: '80' };

        protocolSelect.addEventListener('change', () => {
            portInput.placeholder = defaultPorts[protocolSelect.value] || '';
        });

        overlay.querySelector('#net-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        overlay.querySelector('#net-connect').addEventListener('click', async () => {
            const protocol = protocolSelect.value;
            const server = overlay.querySelector('#net-server').value.trim();
            const port = overlay.querySelector('#net-port').value.trim() || defaultPorts[protocol];
            const share = overlay.querySelector('#net-share').value.trim();
            const username = overlay.querySelector('#net-user').value.trim();
            const password = overlay.querySelector('#net-pass').value;

            if (!server) {
                overlay.querySelector('#net-server').style.borderColor = '#d32f2f';
                overlay.querySelector('#net-server').focus();
                return;
            }

            const connectBtn = overlay.querySelector('#net-connect');
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Connecting...';

            try {
                const { ApiClient } = await import('../../system/lib/ApiClient.js');
                const result = await ApiClient.post('/api/fs/network/connect', {
                    protocol,
                    server,
                    port,
                    username,
                    password,
                    share
                });

                overlay.remove();

                if (result.success) {
                    const { DialogService } = await import('../../system/lib/DialogService.js');
                    await DialogService.alert(
                        `Connected to ${server}!\n\nConnection ID: ${result.connectionId}\n\nUse the Network section in sidebar to browse.`,
                        { title: 'Network Connection', type: 'success' }
                    );

                    const state = this.instances.get(windowId);
                    if (state) {
                        if (!state.networkConnections) state.networkConnections = [];
                        state.networkConnections.push({
                            connectionId: result.connectionId,
                            server: result.server,
                            protocol: result.protocol
                        });
                    }
                } else {
                    const { DialogService } = await import('../../system/lib/DialogService.js');
                    await DialogService.alert(
                        `Connection failed: ${result.message || result.error}`,
                        { title: 'Network Error', type: 'error' }
                    );
                }
            } catch (error) {
                overlay.remove();
                const { DialogService } = await import('../../system/lib/DialogService.js');
                await DialogService.alert(
                    `Connection error: ${error.message}`,
                    { title: 'Network Error', type: 'error' }
                );
            }
        });

        setTimeout(() => overlay.querySelector('#net-server').focus(), 100);
    }

    static showInstanceContextMenu(windowId, e, target, type = null) {
        const win = document.getElementById(windowId);
        if (!win) return;
        const state = this.instances.get(windowId);
        if (state) {
            state.contextTarget = target;
        }

        this.hideInstanceContextMenus(windowId);

        let menuClass;
        if (type === 'sidebar') {
            menuClass = '.exp-context-sidebar';
        } else if (target) {
            menuClass = '.exp-context-file';
        } else {
            menuClass = '.exp-context-empty';
        }

        const menu = win.querySelector(menuClass);
        if (menu) {
            const existingGlobal = document.getElementById('exp-global-context-menu');
            if (existingGlobal) existingGlobal.remove();

            const globalMenu = menu.cloneNode(true);
            globalMenu.id = 'exp-global-context-menu';
            globalMenu.setAttribute('data-window-id', windowId);

            globalMenu.style.left = e.clientX + 'px';
            globalMenu.style.top = e.clientY + 'px';
            globalMenu.style.display = 'block';
            globalMenu.classList.add('show');

            document.body.appendChild(globalMenu);

            const ExplorerClass = this;

            globalMenu.querySelectorAll('.dropdown-item[data-action]').forEach(item => {
                item.addEventListener('click', async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const action = item.dataset.action;
                    globalMenu.remove();
                    await ExplorerClass.handleContextAction(windowId, action);
                });
            });

            const closeHandler = (event) => {
                if (!globalMenu.contains(event.target)) {
                    globalMenu.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }
    }

    static hideInstanceContextMenus(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;
        win.querySelectorAll('.exp-context-menu').forEach(menu => {
            menu.style.display = 'none';
            menu.classList.remove('show');
        });
    }

    static async handleContextAction(windowId, action) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const target = state.contextTarget;
        const currentPath = state.currentPath;

        switch (action) {
            case 'open':
                if (target) {
                    const fullPath = target.path || (currentPath === '/' ? `/${target.name}` : `${currentPath}/${target.name}`);
                    if (target.isFolder) {
                        this.navigateInstanceTo(windowId, fullPath);
                    } else {
                        this.openInstanceFile(windowId, target.name);
                    }
                }
                break;

            case 'open-location':
                if (target?.path) {
                    this.navigateInstanceTo(windowId, target.path);
                }
                break;

            case 'open-new-window':
                if (target?.path) {
                    this.createNewInstance({ startPath: target.path });
                }
                break;

            case 'open-terminal':
                const termPath = target?.isFolder
                    ? (target.path || (currentPath === '/' ? `/${target.name}` : `${currentPath}/${target.name}`))
                    : currentPath;
                const { Terminal } = await import('../Terminal/Terminal.js');
                Terminal.createNewInstance({ startPath: termPath });
                break;

            case 'new-folder': {
                const existingNames = this.getExistingNames(windowId);
                const newName = await this.showNewItemDialog('folder', existingNames);
                if (newName) {
                    const folderPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
                    const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                    const success = await FileSystemService.mkdir(folderPath);
                    if (success) {
                        ExplorerService.clearCache(currentPath);
                        this.navigateInstanceTo(windowId, currentPath);
                    }
                }
                break;
            }

            case 'new-file': {
                const existingNames = this.getExistingNames(windowId);
                const newName = await this.showNewItemDialog('file', existingNames);
                if (newName) {
                    const filePath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
                    const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                    const success = await FileSystemService.write(filePath, '');
                    if (success) {
                        ExplorerService.clearCache(currentPath);
                        this.navigateInstanceTo(windowId, currentPath);
                    }
                }
                break;
            }

            case 'cut':
            case 'copy': {
                const win = document.getElementById(windowId);
                const selectedItems = win.querySelectorAll('.file-item.selected');

                let items = [];
                if (selectedItems.length > 0) {
                    selectedItems.forEach(el => {
                        const name = el.querySelector('.file-name').textContent;
                        const isFolder = el.querySelector('.icon-folder') !== null;
                        const sourcePath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
                        items.push({ name, isFolder, sourcePath });
                    });
                } else if (target) {
                    const sourcePath = currentPath === '/' ? `/${target.name}` : `${currentPath}/${target.name}`;
                    items.push({ ...target, sourcePath });
                }

                if (items.length > 0) {
                    state.clipboard = items;
                    state.clipboardAction = action;
                    console.log(`[Explorer] ${action === 'cut' ? 'Cut' : 'Copy'}: ${items.length} item(s)`);
                }
                break;
            }

            case 'paste':
                if (state.clipboard && state.clipboard.length > 0) {
                    const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                    const existingNames = this.getExistingNames(windowId);

                    let applyToAll = null;
                    const sourceDirs = new Set();
                    let pastedCount = 0;

                    for (const item of state.clipboard) {
                        const sourcePath = item.sourcePath;
                        let destPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;

                        if (!sourcePath) {
                            console.error('[Explorer] Paste failed: no source path for', item.name);
                            continue;
                        }

                        if (sourcePath === destPath) {
                            console.warn('[Explorer] Paste skipped: source and destination are the same', item.name);
                            continue;
                        }

                        if (existingNames.includes(item.name)) {
                            let resolution = applyToAll;

                            if (!resolution) {
                                const remaining = state.clipboard.length - state.clipboard.indexOf(item);
                                resolution = await this.showPasteConflictDialog(item.name, item.isFolder, remaining > 1);

                                if (resolution === 'cancel') {
                                    break;
                                }

                                if (resolution.endsWith('-all')) {
                                    applyToAll = resolution.replace('-all', '');
                                    resolution = applyToAll;
                                }
                            }

                            if (resolution === 'skip') {
                                continue;
                            } else if (resolution === 'rename') {
                                const newName = this.generateUniqueName(item.name, existingNames);
                                destPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
                                existingNames.push(newName);
                            }
                        }

                        let success = false;
                        if (item.isFolder) {
                            if (state.clipboardAction === 'cut') {
                                success = await FileSystemService.move(sourcePath, destPath);
                            } else {
                                success = await FileSystemService.copy(sourcePath, destPath);
                            }
                        } else {
                            const content = await FileSystemService.read(sourcePath);
                            if (content) {
                                success = await FileSystemService.write(destPath, content.content || '');
                                if (success && state.clipboardAction === 'cut') {
                                    await FileSystemService.delete(sourcePath);
                                }
                            }
                        }

                        if (success) {
                            pastedCount++;
                            if (state.clipboardAction === 'cut') {
                                const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/')) || '/';
                                sourceDirs.add(sourceDir);
                            }
                            existingNames.push(item.name);
                        }
                    }

                    if (state.clipboardAction === 'cut' && pastedCount > 0) {
                        state.clipboard = null;
                        state.clipboardAction = null;
                        sourceDirs.forEach(dir => ExplorerService.clearCache(dir));
                    }

                    if (pastedCount > 0) {
                        ExplorerService.clearCache(currentPath);
                        this.navigateInstanceTo(windowId, currentPath);
                    }
                }
                break;

            case 'rename': {
                if (target) {
                    const { DialogService } = await import('../../system/lib/DialogService.js');
                    const newName = await DialogService.prompt('New name:', target.name, { title: 'Rename' });
                    if (newName && newName !== target.name) {
                        const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                        const oldPath = currentPath === '/' ? `/${target.name}` : `${currentPath}/${target.name}`;

                        const success = await FileSystemService.rename(oldPath, newName);
                        if (success) {
                            ExplorerService.clearCache(currentPath);
                            this.navigateInstanceTo(windowId, currentPath);
                        } else {
                            await DialogService.alert('Failed to rename. Please try again.', { title: 'Rename Error', type: 'error' });
                        }
                    }
                }
                break;
            }

            case 'delete': {
                if (target) {
                    const { DialogService } = await import('../../system/lib/DialogService.js');
                    const confirmed = await DialogService.danger(
                        `Are you sure you want to delete "${target.name}"?`,
                        { title: 'Delete', confirmText: 'Delete', cancelText: 'Cancel' }
                    );
                    if (confirmed) {
                        const { FileSystemService } = await import('../../system/lib/FileSystemService.js');
                        const deletePath = currentPath === '/' ? `/${target.name}` : `${currentPath}/${target.name}`;
                        const success = await FileSystemService.delete(deletePath);
                        if (success) {
                            ExplorerService.clearCache(currentPath);
                            this.navigateInstanceTo(windowId, currentPath);
                        }
                    }
                }
                break;
            }

            case 'refresh':
                this.navigateInstanceTo(windowId, currentPath);
                break;

            case 'select-all':
                const win = document.getElementById(windowId);
                if (win) {
                    win.querySelectorAll('.file-item').forEach(item => item.classList.add('selected'));
                }
                break;

            case 'properties':
            case 'folder-properties': {
                const { DialogService } = await import('../../system/lib/DialogService.js');
                const propPath = target
                    ? (currentPath === '/' ? `/${target.name}` : `${currentPath}/${target.name}`)
                    : currentPath;
                await DialogService.alert(`Path: ${propPath}\nType: ${target?.isFolder ? 'Folder' : 'File'}`, { title: 'Properties' });
                break;
            }
        }
    }

    static updateInstanceBreadcrumb(windowId, path) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const b = win.querySelector('.exp-breadcrumb-path');
        if (!b) return;

        b.innerHTML = '';
        const parts = path.split('/').filter(p => p);

        const root = document.createElement('span');
        root.className = 'breadcrumb-segment';
        root.innerText = '/';
        root.onclick = () => this.navigateInstanceTo(windowId, '/');
        b.appendChild(root);

        let build = '';
        parts.forEach(p => {
            build += '/' + p;
            const sp = document.createElement('span');
            sp.innerText = ' > ';
            sp.className = 'breadcrumb-divider';
            b.appendChild(sp);

            const seg = document.createElement('span');
            seg.className = 'breadcrumb-segment';
            seg.innerText = p;
            const target = build;
            seg.onclick = () => this.navigateInstanceTo(windowId, target);
            b.appendChild(seg);
        });
    }

    static getFolderIcon() {
        return '<i class="ph ph-folder file-icon icon-folder"></i>';
    }

    static getFileIcon(name) {
        const ext = name.split('.').pop().toLowerCase();

        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
            return '<i class="ph ph-image file-icon icon-image"></i>';
        }
        if (['mp3', 'wav', 'flac', 'ogg'].includes(ext)) {
            return '<i class="ph ph-music-notes file-icon icon-audio"></i>';
        }
        if (['mp4', 'mkv', 'avi', 'webm'].includes(ext)) {
            return '<i class="ph ph-video file-icon icon-video"></i>';
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return '<i class="ph ph-file-zip file-icon icon-archive"></i>';
        }
        if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
            return '<i class="ph ph-file-js file-icon icon-code"></i>';
        }
        if (['css', 'scss', 'sass', 'less'].includes(ext)) {
            return '<i class="ph ph-file-css file-icon icon-code"></i>';
        }
        if (['html', 'htm', 'xml'].includes(ext)) {
            return '<i class="ph ph-file-html file-icon icon-code"></i>';
        }
        if (['py', 'java', 'c', 'cpp', 'h', 'sh', 'rb', 'go', 'rs'].includes(ext)) {
            return '<i class="ph ph-file-code file-icon icon-code"></i>';
        }
        if (['json', 'yaml', 'yml', 'toml'].includes(ext)) {
            return '<i class="ph ph-file-code file-icon icon-config"></i>';
        }
        if (['txt', 'md', 'log', 'ini', 'conf', 'cfg'].includes(ext)) {
            return '<i class="ph ph-file-text file-icon icon-text"></i>';
        }
        if (['pdf'].includes(ext)) {
            return '<i class="ph ph-file-pdf file-icon icon-pdf"></i>';
        }
        if (['doc', 'docx', 'odt'].includes(ext)) {
            return '<i class="ph ph-file-doc file-icon icon-doc"></i>';
        }
        if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
            return '<i class="ph ph-file-xls file-icon icon-xls"></i>';
        }
        if (['ppt', 'pptx', 'odp'].includes(ext)) {
            return '<i class="ph ph-file-ppt file-icon icon-ppt"></i>';
        }
        return '<i class="ph ph-file file-icon icon-file"></i>';
    }

    static getExistingNames(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return [];
        const items = win.querySelectorAll('.file-item .file-name');
        return Array.from(items).map(el => el.textContent);
    }

    static generateUniqueName(name, existingNames) {
        if (!existingNames.includes(name)) return name;

        const hasExt = name.includes('.') && !name.startsWith('.');
        const ext = hasExt ? '.' + name.split('.').pop() : '';
        const base = hasExt ? name.slice(0, -ext.length) : name;

        let counter = 1;
        let newName;
        do {
            newName = `${base} (${counter})${ext}`;
            counter++;
        } while (existingNames.includes(newName));

        return newName;
    }

    static showPasteConflictDialog(fileName, isFolder, hasMore) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.innerHTML = `
                <div class="dialog-window glass" style="width: 450px;">
                    <div class="window-header">
                        <div class="title-drag-area">
                            <i class="ph ph-warning" style="color: #ff9800; margin-right: 10px; font-size: 18px;"></i>
                            File Conflict
                        </div>
                    </div>
                    <div class="dialog-body">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            ${isFolder ? '<i class="ph ph-folder" style="font-size: 40px; color: #fdd835;"></i>' : '<i class="ph ph-file" style="font-size: 40px; color: #888;"></i>'}
                            <div>
                                <div style="font-weight: 600; font-size: 14px; word-break: break-all;">${fileName}</div>
                                <div style="color: #666; font-size: 13px; margin-top: 4px;">
                                    A ${isFolder ? 'folder' : 'file'} with this name already exists in this location.
                                </div>
                            </div>
                        </div>
                        <div style="color: #555; font-size: 13px;">What would you like to do?</div>
                    </div>
                    <div class="dialog-footer" style="flex-wrap: wrap; gap: 8px;">
                        <button class="dialog-btn" data-action="cancel">Cancel</button>
                        <div style="flex: 1;"></div>
                        <button class="dialog-btn" data-action="skip" title="Skip this file">Skip</button>
                        <button class="dialog-btn" data-action="rename" title="Keep both by renaming">Rename</button>
                        <button class="dialog-btn primary" data-action="replace" title="Replace existing file">Replace</button>
                    </div>
                    ${hasMore ? `
                    <div class="dialog-footer" style="border-top: 1px dashed #e0e0e0; padding-top: 12px; background: #f5f5f5;">
                        <span style="font-size: 12px; color: #666;">Apply to remaining conflicts:</span>
                        <div style="flex: 1;"></div>
                        <button class="dialog-btn" data-action="skip-all" style="font-size: 11px; padding: 6px 10px;">Skip All</button>
                        <button class="dialog-btn" data-action="rename-all" style="font-size: 11px; padding: 6px 10px;">Rename All</button>
                        <button class="dialog-btn" data-action="replace-all" style="font-size: 11px; padding: 6px 10px;">Replace All</button>
                    </div>
                    ` : ''}
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    overlay.remove();
                    resolve(btn.dataset.action);
                });
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve('cancel');
                }
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', handleEscape);
                    resolve('cancel');
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    static showNewItemDialog(type, existingNames) {
        return new Promise((resolve) => {
            const isFolder = type === 'folder';
            const defaultName = isFolder ? 'New Folder' : 'New File.txt';

            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.innerHTML = `
                <div class="dialog-window glass" style="width: 380px;">
                    <div class="window-header">
                        <div class="title-drag-area">
                            <i class="ph ph-${isFolder ? 'folder-plus' : 'file-plus'}" style="margin-right: 10px; font-size: 16px;"></i>
                            New ${isFolder ? 'Folder' : 'Text File'}
                        </div>
                    </div>
                    <div class="dialog-body">
                        <div class="form-row">
                            <label>${isFolder ? 'Folder' : 'File'} name:</label>
                            <input type="text" class="form-input new-item-input" value="${defaultName}" />
                        </div>
                        <div class="new-item-warning" style="display: none; color: #d32f2f; font-size: 12px; margin-top: 8px;">
                            <i class="ph ph-warning"></i>
                            <span>A ${isFolder ? 'folder' : 'file'} with this name already exists.</span>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn cancel-btn">Cancel</button>
                        <button class="dialog-btn primary create-btn">Create</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const input = overlay.querySelector('.new-item-input');
            const warning = overlay.querySelector('.new-item-warning');
            const createBtn = overlay.querySelector('.create-btn');
            const cancelBtn = overlay.querySelector('.cancel-btn');

            input.focus();
            if (!isFolder && defaultName.includes('.')) {
                const dotIndex = defaultName.lastIndexOf('.');
                input.setSelectionRange(0, dotIndex);
            } else {
                input.select();
            }

            const validateName = () => {
                const value = input.value.trim();
                const isDuplicate = existingNames.includes(value);
                const isEmpty = value === '';

                if (isDuplicate) {
                    warning.style.display = 'flex';
                    warning.querySelector('span').textContent = `A ${isFolder ? 'folder' : 'file'} with this name already exists.`;
                } else if (isEmpty) {
                    warning.style.display = 'flex';
                    warning.querySelector('span').textContent = 'Name cannot be empty.';
                } else {
                    warning.style.display = 'none';
                }

                createBtn.disabled = isDuplicate || isEmpty;
                createBtn.style.opacity = (isDuplicate || isEmpty) ? '0.5' : '1';
                createBtn.style.cursor = (isDuplicate || isEmpty) ? 'not-allowed' : 'pointer';
            };

            input.addEventListener('input', validateName);
            validateName();

            const doCreate = () => {
                const value = input.value.trim();
                if (value && !existingNames.includes(value)) {
                    overlay.remove();
                    resolve(value);
                }
            };

            createBtn.addEventListener('click', doCreate);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') doCreate();
            });

            const doCancel = () => {
                overlay.remove();
                resolve(null);
            };

            cancelBtn.addEventListener('click', doCancel);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) doCancel();
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEscape);
                    doCancel();
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }
}
