import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';
import { ApiClient } from '../../system/lib/ApiClient.js';
import { AuthService } from '../../system/lib/AuthService.js';
import { FilePickerDialog } from '../../system/components/Dialogs/FilePickerDialog.js';

export class MediaCenter {
    static instances = new Map();
    static API_BASE = '/media';
    static CONFIG_PATH = '/storage/configs/media_center.json';

    static defaultSettings = {
        viewMode: 'grid',
        shuffle: false,
        repeat: 'none',
        volume: 1,
        currentFilter: 'all',
        sortBy: 'name',
        lastPlayedPath: null,
        windowState: {
            width: 950,
            height: 620
        }
    };

    static getToken() {
        return AuthService.getToken() || '';
    }

    static getMediaUrl(path, endpoint = 'stream') {
        const token = this.getToken();
        return `http://localhost:8080/api/media/${endpoint}?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`;
    }

    static async loadSettings() {
        try {
            const response = await ApiClient.get(`${this.API_BASE}/config`);
            if (response.success && response.config) {
                const data = response.config;
                const prefs = data.preferences || data;
                const windowState = data['window-state'] || data.windowState || {};
                const folders = data.library?.folders || data.folders || [];
                return {
                    viewMode: prefs.defaultView || prefs.viewMode || this.defaultSettings.viewMode,
                    shuffle: prefs.shuffle ?? this.defaultSettings.shuffle,
                    repeat: prefs.repeat || this.defaultSettings.repeat,
                    volume: (prefs.volume > 1 ? prefs.volume / 100 : prefs.volume) ?? this.defaultSettings.volume,
                    currentFilter: prefs.currentFilter || this.defaultSettings.currentFilter,
                    sortBy: prefs.sortBy || this.defaultSettings.sortBy,
                    lastPlayedPath: prefs.lastPlayedPath || null,
                    windowState: {
                        width: windowState.width || this.defaultSettings.windowState.width,
                        height: windowState.height || this.defaultSettings.windowState.height
                    },
                    folders: folders
                };
            }
        } catch (e) {
            console.log('[MediaCenter] Using default settings');
        }
        return { ...this.defaultSettings, folders: [] };
    }

    static async saveSettings(windowId) {
        const state = this.instances.get(windowId);
        if (!state) return;

        const win = document.getElementById(windowId);
        const rect = win ? win.getBoundingClientRect() : null;

        const config = {
            preferences: {
                defaultView: state.viewMode,
                shuffle: state.shuffle,
                repeat: state.repeat,
                volume: Math.round(state.volume * 100),
                currentFilter: state.currentFilter,
                sortBy: state.sortBy,
                lastPlayedPath: state.currentItem?.path || null
            },
            'window-state': rect ? {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                isMaximized: false
            } : (state.windowState || {}),
            library: {
                folders: state.scannedFolders || []
            }
        };

        try {
            await ApiClient.post(`${this.API_BASE}/config`, { config });
            console.log('[MediaCenter] Settings saved');
        } catch (e) {
            console.log('[MediaCenter] Could not save settings:', e);
        }
    }

    static async createNewInstance(options = {}) {
        const icon = '<i class="ph ph-play-circle" style="font-size:16px; color:#0078d4;"></i>';
        const windowContent = this.getWindowContent();
        const settings = await this.loadSettings();

        const windowId = WindowManager.createWindow('media-app', {
            title: 'Media Center',
            width: settings.windowState?.width || 950,
            height: settings.windowState?.height || 620,
            content: windowContent,
            icon: icon
        });

        const instance = {
            currentFilter: settings.currentFilter || 'all',
            library: [],
            playlist: [],
            playQueue: [],
            currentIndex: -1,
            currentItem: null,
            currentMediaType: null,
            isPlaying: false,
            shuffle: settings.shuffle,
            repeat: settings.repeat,
            sortBy: settings.sortBy || 'name',
            volume: settings.volume,
            viewMode: settings.viewMode,
            displayMode: 'library',
            scannedFolders: [],
            zoomLevel: 1,
            lastPlayedPath: settings.lastPlayedPath,
            windowState: settings.windowState
        };

        this.instances.set(windowId, instance);
        this.initInstance(windowId);
        this.loadLibrary(windowId);

        return windowId;
    }

    static async openFile(filePath) {
        const filename = filePath.split('/').pop();
        const ext = filename.split('.').pop().toLowerCase();
        const folder = filePath.substring(0, filePath.lastIndexOf('/')) || '/';

        const audioExts = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'];
        const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv', 'm4v'];
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];

        let type = 'unknown';
        if (audioExts.includes(ext)) type = 'music';
        else if (videoExts.includes(ext)) type = 'video';
        else if (imageExts.includes(ext)) type = 'photo';

        if (type === 'unknown') {
            console.log('[MediaCenter] Unsupported file type:', ext);
            return;
        }

        let windowId;
        let isNewWindow = false;

        if (this.instances.size > 0) {
            windowId = this.instances.keys().next().value;
            const existingWin = document.getElementById(windowId);
            if (existingWin) {
                WindowManager.focusWindow(windowId);
            } else {
                this.instances.delete(windowId);
                windowId = await this.createNewInstance();
                isNewWindow = true;
            }
        } else {
            windowId = await this.createNewInstance();
            isNewWindow = true;
        }

        const state = this.instances.get(windowId);
        if (!state) return;

        const win = document.getElementById(windowId);
        if (!win) return;

        state.audioElement.pause();
        state.audioElement.src = '';
        state.videoElement.pause();
        state.videoElement.src = '';
        state.isPlaying = false;

        const item = {
            id: btoa(encodeURIComponent(filePath)),
            name: filename.replace(/\.[^/.]+$/, ''),
            filename: filename,
            path: filePath,
            type: type,
            folder: folder
        };

        state.playlist = [item];
        state.currentIndex = 0;
        state.currentItem = item;
        state.currentMediaType = type;

        win.querySelector('.mc-player-title').textContent = item.name;
        win.querySelector('.mc-player-artist').textContent = folder.split('/').pop() || 'Root';
        win.querySelector('.mc-time-current').textContent = '0:00';
        win.querySelector('.mc-time-total').textContent = '0:00';
        win.querySelector('.mc-progress-fill').style.width = '0%';

        const thumb = win.querySelector('.mc-player-thumb');

        if (type === 'photo') {
            thumb.innerHTML = `<img src="${this.getMediaUrl(item.path, 'thumbnail')}" alt="">`;
            this.showViewer(windowId, item);
        } else if (type === 'music') {
            thumb.innerHTML = `<i class="ph ph-music-notes"></i>`;
            state.audioElement.src = this.getMediaUrl(item.path);
            state.audioElement.volume = state.volume;
            state.audioElement.play().catch(e => console.log('[MediaCenter] Autoplay blocked:', e));
            state.isPlaying = true;
            this.updatePlayButton(windowId);
            this.showLibraryView(windowId, false);
        } else if (type === 'video') {
            thumb.innerHTML = `<i class="ph ph-film-strip"></i>`;
            state.videoElement.src = this.getMediaUrl(item.path);
            state.videoElement.volume = state.volume;
            state.videoElement.play().catch(e => console.log('[MediaCenter] Autoplay blocked:', e));
            state.isPlaying = true;
            this.updatePlayButton(windowId);

            win.querySelector('.mc-library').style.display = 'none';
            win.querySelector('.mc-viewer').style.display = 'flex';
            state.displayMode = 'viewer';

            const imgEl = win.querySelector('.mc-viewer-image');
            const zoomControls = win.querySelector('.mc-viewer-controls');
            const audioVisual = win.querySelector('.mc-audio-visual');

            imgEl.style.display = 'none';
            zoomControls.style.display = 'none';
            if (audioVisual) audioVisual.style.display = 'none';

            state.videoElement.style.display = 'block';
            win.querySelector('.mc-viewer-title').textContent = item.name;
        }

        this.saveSettings(windowId);
    }

    static getWindowContent() {
        return `
            <div class="mc-layout">
                <div class="mc-sidebar">
                    <button class="mc-add-folder-btn">
                        <i class="ph ph-folder-plus"></i> Add Folder
                    </button>
                    <div class="mc-nav-section">
                        <div class="mc-nav-title">LIBRARY</div>
                        <div class="mc-nav-item active" data-filter="all">
                            <i class="ph ph-squares-four"></i><span>All Media</span>
                            <span class="mc-nav-count" data-count="all">0</span>
                        </div>
                        <div class="mc-nav-item" data-filter="music">
                            <i class="ph ph-music-notes"></i><span>Music</span>
                            <span class="mc-nav-count" data-count="music">0</span>
                        </div>
                        <div class="mc-nav-item" data-filter="video">
                            <i class="ph ph-film-strip"></i><span>Videos</span>
                            <span class="mc-nav-count" data-count="video">0</span>
                        </div>
                        <div class="mc-nav-item" data-filter="photo">
                            <i class="ph ph-image"></i><span>Photos</span>
                            <span class="mc-nav-count" data-count="photo">0</span>
                        </div>
                    </div>
                    <div class="mc-nav-section">
                        <div class="mc-nav-title">FOLDERS</div>
                        <div class="mc-folders-list"></div>
                    </div>
                </div>

                <div class="mc-main">
                    <div class="mc-viewer" style="display:none;">
                        <div class="mc-viewer-header">
                            <button class="mc-back-btn" title="Back to Library"><i class="ph ph-arrow-left"></i></button>
                            <div class="mc-viewer-title"></div>
                            <div class="mc-viewer-controls">
                                <button class="mc-zoom-out" title="Zoom Out"><i class="ph ph-minus"></i></button>
                                <span class="mc-zoom-level">100%</span>
                                <button class="mc-zoom-in" title="Zoom In"><i class="ph ph-plus"></i></button>
                                <button class="mc-zoom-fit" title="Fit"><i class="ph ph-arrows-in"></i></button>
                            </div>
                        </div>
                        <div class="mc-viewer-content">
                            <img class="mc-viewer-image" src="" alt="" style="display:none;">
                            <video class="mc-viewer-video" style="display:none;"></video>
                        </div>
                    </div>

                    <div class="mc-library">
                        <div class="mc-toolbar">
                            <div class="mc-toolbar-left">
                                <span class="mc-view-title">All Media</span>
                                <span class="mc-item-count">0 items</span>
                            </div>
                            <div class="mc-toolbar-right">
                                <div class="mc-search-box">
                                    <i class="ph ph-magnifying-glass"></i>
                                    <input type="text" placeholder="Search..." class="mc-search-input">
                                </div>
                                <div class="mc-sort-dropdown">
                                    <button class="mc-sort-btn"><i class="ph ph-sort-ascending"></i> Name <i class="ph ph-caret-down"></i></button>
                                    <div class="mc-sort-menu">
                                        <div class="mc-sort-option active" data-sort="name"><i class="ph ph-text-aa"></i> Name</div>
                                        <div class="mc-sort-option" data-sort="date"><i class="ph ph-calendar"></i> Date</div>
                                        <div class="mc-sort-option" data-sort="size"><i class="ph ph-file"></i> Size</div>
                                    </div>
                                </div>
                                <div class="mc-view-toggle">
                                    <button class="mc-view-btn active" data-view="grid" title="Grid View"><i class="ph ph-squares-four"></i></button>
                                    <button class="mc-view-btn" data-view="list" title="List View"><i class="ph ph-list"></i></button>
                                </div>
                                <button class="mc-scan-btn" title="Rescan"><i class="ph ph-arrows-clockwise"></i></button>
                            </div>
                        </div>
                        <div class="mc-content">
                            <div class="mc-grid"></div>
                            <div class="mc-empty-state" style="display:none;">
                                <i class="ph ph-folder-open"></i>
                                <p>No media files found</p>
                                <span>Click "Add Folder" to scan for media</span>
                            </div>
                            <div class="mc-loading" style="display:none;">
                                <div class="mc-spinner"></div>
                                <p>Scanning...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mc-player-bar">
                <div class="mc-player-info">
                    <div class="mc-player-thumb"><i class="ph ph-music-notes"></i></div>
                    <div class="mc-player-text">
                        <div class="mc-player-title">Select media...</div>
                        <div class="mc-player-artist">--</div>
                    </div>
                </div>

                <div class="mc-player-controls">
                    <div class="mc-player-buttons">
                        <button class="mc-btn mc-btn-shuffle" title="Shuffle"><i class="ph ph-shuffle"></i></button>
                        <button class="mc-btn mc-btn-prev" title="Previous"><i class="ph ph-skip-back"></i></button>
                        <button class="mc-btn mc-btn-play" title="Play"><i class="ph ph-play"></i></button>
                        <button class="mc-btn mc-btn-next" title="Next"><i class="ph ph-skip-forward"></i></button>
                        <button class="mc-btn mc-btn-repeat" title="Repeat"><i class="ph ph-repeat"></i></button>
                    </div>
                    <div class="mc-player-progress">
                        <span class="mc-time-current">0:00</span>
                        <div class="mc-progress-bar"><div class="mc-progress-fill"></div></div>
                        <span class="mc-time-total">0:00</span>
                    </div>
                </div>

                <div class="mc-player-extra">
                    <button class="mc-btn mc-btn-volume" title="Volume"><i class="ph ph-speaker-high"></i></button>
                    <div class="mc-volume-slider"><div class="mc-volume-fill"></div></div>
                </div>
            </div>

            <audio class="mc-audio-element" style="display:none;"></audio>
        `;
    }

    static async loadLibrary(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const loading = win.querySelector('.mc-loading');
        const emptyState = win.querySelector('.mc-empty-state');
        const grid = win.querySelector('.mc-grid');

        loading.style.display = 'flex';
        emptyState.style.display = 'none';
        grid.style.display = 'none';

        try {
            await ApiClient.get(`${this.API_BASE}/scan`);
            await this.fetchLibrary(windowId);
        } catch (error) {
            console.error('[MediaCenter] Error scanning:', error);
        }

        loading.style.display = 'none';
    }

    static async fetchLibrary(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);

        try {
            const result = await ApiClient.get(`${this.API_BASE}/library`);
            if (result.success) {
                state.library = result.items;
                this.updateCounts(windowId);
                this.renderMedia(windowId);
            }

            const foldersResult = await ApiClient.get(`${this.API_BASE}/folders`);
            if (foldersResult.success) {
                state.scannedFolders = foldersResult.folders;
                this.renderFolders(windowId);
            }
        } catch (error) {
            console.error('[MediaCenter] Error fetching library:', error);
        }
    }

    static updateCounts(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const library = state.library;

        const counts = {
            all: library.length,
            music: library.filter(m => m.type === 'music').length,
            video: library.filter(m => m.type === 'video').length,
            photo: library.filter(m => m.type === 'photo').length
        };

        for (const [key, count] of Object.entries(counts)) {
            const el = win.querySelector(`.mc-nav-count[data-count="${key}"]`);
            if (el) el.textContent = count;
        }
    }

    static renderFolders(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const list = win.querySelector('.mc-folders-list');

        list.innerHTML = state.scannedFolders.map(folder => `
            <div class="mc-folder-item" data-path="${folder}">
                <i class="ph ph-folder"></i>
                <span>${folder.split('/').pop() || folder}</span>
                <button class="mc-folder-remove" data-path="${folder}"><i class="ph ph-x"></i></button>
            </div>
        `).join('');

        list.querySelectorAll('.mc-folder-item').forEach(item => {
            item.onclick = (e) => {
                if (e.target.closest('.mc-folder-remove')) return;
                this.filterByFolder(windowId, item.dataset.path);
            };
        });

        list.querySelectorAll('.mc-folder-remove').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                await this.removeFolder(windowId, btn.dataset.path);
            };
        });
    }

    static filterByFolder(windowId, folderPath) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        state.currentFilter = 'folder:' + folderPath;

        win.querySelectorAll('.mc-nav-item').forEach(i => i.classList.remove('active'));
        win.querySelectorAll('.mc-folder-item').forEach(i => {
            i.classList.toggle('active', i.dataset.path === folderPath);
        });

        this.showLibraryView(windowId);
        this.renderMedia(windowId);
    }

    static async removeFolder(windowId, path) {
        try {
            await ApiClient.post(`${this.API_BASE}/folders/remove`, { path });
            await this.fetchLibrary(windowId);
            this.saveSettings(windowId);
        } catch (error) {
            console.error('[MediaCenter] Error removing folder:', error);
        }
    }

    static initInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        state.audioElement = win.querySelector('.mc-audio-element');
        state.videoElement = win.querySelector('.mc-viewer-video');

        win.querySelectorAll('.mc-nav-item[data-filter]').forEach(item => {
            item.onclick = () => {
                win.querySelectorAll('.mc-nav-item').forEach(i => i.classList.remove('active'));
                win.querySelectorAll('.mc-folder-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.currentFilter = item.dataset.filter;
                this.showLibraryView(windowId);
                this.renderMedia(windowId);
            };
        });

        const searchInput = win.querySelector('.mc-search-input');
        let searchTimeout;
        searchInput.oninput = () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.renderMedia(windowId), 300);
        };

        const sortBtn = win.querySelector('.mc-sort-btn');
        const sortMenu = win.querySelector('.mc-sort-menu');
        sortBtn.onclick = (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('show');
        };

        win.querySelectorAll('.mc-sort-option').forEach(opt => {
            opt.onclick = () => {
                win.querySelectorAll('.mc-sort-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.sortBy = opt.dataset.sort;
                sortBtn.innerHTML = `<i class="ph ph-sort-ascending"></i> ${opt.textContent.trim()} <i class="ph ph-caret-down"></i>`;
                sortMenu.classList.remove('show');
                this.renderMedia(windowId);
            };
        });

        document.addEventListener('click', () => sortMenu.classList.remove('show'));

        win.querySelectorAll('.mc-view-btn').forEach(btn => {
            btn.onclick = () => {
                win.querySelectorAll('.mc-view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.viewMode = btn.dataset.view;
                this.renderMedia(windowId);
                this.saveSettings(windowId);
            };
        });

        const viewBtn = win.querySelector(`.mc-view-btn[data-view="${state.viewMode}"]`);
        if (viewBtn) {
            win.querySelectorAll('.mc-view-btn').forEach(b => b.classList.remove('active'));
            viewBtn.classList.add('active');
        }

        win.querySelector('.mc-scan-btn').onclick = () => this.loadLibrary(windowId);
        win.querySelector('.mc-add-folder-btn').onclick = () => this.showAddFolderDialog(windowId);
        win.querySelector('.mc-back-btn').onclick = () => this.showLibraryView(windowId);

        win.querySelector('.mc-player-info').onclick = () => {
            const state = this.instances.get(windowId);
            if (!state.currentItem) return;

            if (state.displayMode === 'viewer') {
                this.showLibraryView(windowId, false);
            } else {
                if (state.currentItem.type === 'music') {
                    this.showMusicViewer(windowId, state.currentItem);
                } else {
                    this.showViewer(windowId, state.currentItem, false);
                }
            }
        };

        win.querySelector('.mc-btn-play').onclick = () => this.togglePlay(windowId);
        win.querySelector('.mc-btn-prev').onclick = () => this.playPrevious(windowId);
        win.querySelector('.mc-btn-next').onclick = () => this.playNext(windowId);

        win.querySelector('.mc-btn-shuffle').onclick = () => {
            state.shuffle = !state.shuffle;
            win.querySelector('.mc-btn-shuffle').classList.toggle('active', state.shuffle);
            if (state.shuffle) this.shuffleQueue(windowId);
            this.saveSettings(windowId);
        };

        win.querySelector('.mc-btn-repeat').onclick = () => {
            const modes = ['none', 'all', 'one'];
            state.repeat = modes[(modes.indexOf(state.repeat) + 1) % 3];
            const btn = win.querySelector('.mc-btn-repeat');
            btn.classList.toggle('active', state.repeat !== 'none');
            btn.querySelector('i').className = state.repeat === 'one' ? 'ph ph-repeat-once' : 'ph ph-repeat';
            this.saveSettings(windowId);
        };

        win.querySelector('.mc-progress-bar').onclick = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const activeMedia = state.audioElement.src ? state.audioElement : state.videoElement;
            if (activeMedia && activeMedia.duration) {
                activeMedia.currentTime = percent * activeMedia.duration;
            }
        };

        win.querySelector('.mc-volume-slider').onclick = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            state.volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (state.audioElement) state.audioElement.volume = state.volume;
            if (state.videoElement) state.videoElement.volume = state.volume;
            this.updateVolumeUI(windowId);
            this.saveSettings(windowId);
        };

        win.querySelector('.mc-btn-volume').onclick = () => {
            if (state.volume > 0) {
                state.previousVolume = state.volume;
                state.volume = 0;
            } else {
                state.volume = state.previousVolume || 1;
            }
            if (state.audioElement) state.audioElement.volume = state.volume;
            if (state.videoElement) state.videoElement.volume = state.volume;
            this.updateVolumeUI(windowId);
        };

        win.querySelector('.mc-zoom-in').onclick = () => this.adjustZoom(windowId, 0.25);
        win.querySelector('.mc-zoom-out').onclick = () => this.adjustZoom(windowId, -0.25);
        win.querySelector('.mc-zoom-fit').onclick = () => { state.zoomLevel = 1; this.applyZoom(windowId); };

        [state.audioElement, state.videoElement].forEach(el => {
            el.ontimeupdate = () => this.updateProgress(windowId);
            el.onended = () => this.handleMediaEnd(windowId);
            el.onloadedmetadata = () => {
                win.querySelector('.mc-time-total').textContent = this.formatTime(el.duration);
            };
            el.onplay = () => { state.isPlaying = true; this.updatePlayButton(windowId); };
            el.onpause = () => { state.isPlaying = false; this.updatePlayButton(windowId); };
        });

        win.querySelector('.mc-btn-shuffle').classList.toggle('active', state.shuffle);
        win.querySelector('.mc-btn-repeat').classList.toggle('active', state.repeat !== 'none');
        this.updateVolumeUI(windowId);
    }

    static adjustZoom(windowId, delta) {
        const state = this.instances.get(windowId);
        state.zoomLevel = Math.max(0.25, Math.min(4, state.zoomLevel + delta));
        this.applyZoom(windowId);
    }

    static applyZoom(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const img = win.querySelector('.mc-viewer-image');
        const zoomLabel = win.querySelector('.mc-zoom-level');

        img.style.transform = `scale(${state.zoomLevel})`;
        zoomLabel.textContent = `${Math.round(state.zoomLevel * 100)}%`;
    }

    static showLibraryView(windowId, stopMedia = true) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        state.displayMode = 'library';

        win.querySelector('.mc-library').style.display = 'flex';
        win.querySelector('.mc-viewer').style.display = 'none';

        if (stopMedia && state.videoElement && state.currentMediaType !== 'video') {
            state.videoElement.pause();
            state.videoElement.src = '';
        }
    }

    static showMusicViewer(windowId, item) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        state.displayMode = 'viewer';

        win.querySelector('.mc-library').style.display = 'none';
        win.querySelector('.mc-viewer').style.display = 'flex';

        const imgEl = win.querySelector('.mc-viewer-image');
        const videoEl = win.querySelector('.mc-viewer-video');
        const zoomControls = win.querySelector('.mc-viewer-controls');

        imgEl.style.display = 'none';
        videoEl.style.display = 'none';
        zoomControls.style.display = 'none';

        win.querySelector('.mc-viewer-title').textContent = item.name;

        const viewerContent = win.querySelector('.mc-viewer-content');
        let audioVisual = viewerContent.querySelector('.mc-audio-visual');
        if (!audioVisual) {
            audioVisual = document.createElement('div');
            audioVisual.className = 'mc-audio-visual';
            audioVisual.innerHTML = `
                <div class="mc-audio-icon"><i class="ph ph-music-notes"></i></div>
                <div class="mc-audio-info">
                    <div class="mc-audio-title"></div>
                    <div class="mc-audio-folder"></div>
                </div>
            `;
            viewerContent.appendChild(audioVisual);
        }
        audioVisual.style.display = 'flex';
        audioVisual.querySelector('.mc-audio-title').textContent = item.name;
        audioVisual.querySelector('.mc-audio-folder').textContent = item.folder.split('/').pop();
    }

    static showViewer(windowId, item, restartMedia = true) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        state.displayMode = 'viewer';
        state.zoomLevel = 1;

        win.querySelector('.mc-library').style.display = 'none';
        win.querySelector('.mc-viewer').style.display = 'flex';

        const imgEl = win.querySelector('.mc-viewer-image');
        const videoEl = win.querySelector('.mc-viewer-video');
        const zoomControls = win.querySelector('.mc-viewer-controls');
        const audioVisual = win.querySelector('.mc-audio-visual');

        imgEl.style.display = 'none';
        zoomControls.style.display = 'none';
        if (audioVisual) audioVisual.style.display = 'none';

        win.querySelector('.mc-viewer-title').textContent = item.name;

        if (item.type === 'photo') {
            imgEl.src = this.getMediaUrl(item.path);
            imgEl.style.display = 'block';
            imgEl.style.transform = 'scale(1)';
            zoomControls.style.display = 'flex';
            win.querySelector('.mc-zoom-level').textContent = '100%';
            videoEl.style.display = 'none';
        } else if (item.type === 'video') {
            videoEl.style.display = 'block';
            if (restartMedia) {
                videoEl.src = this.getMediaUrl(item.path);
                videoEl.volume = state.volume;
                videoEl.play();
                state.isPlaying = true;
            }
        }
    }

    static async showAddFolderDialog(windowId) {
        const folderPath = await FilePickerDialog.pickFolder({
            title: 'Select Media Folder',
            startPath: '/home/user'
        });

        if (folderPath) {
            try {
                await ApiClient.post(`${this.API_BASE}/folders/add`, { path: folderPath });
                await this.loadLibrary(windowId);
                this.saveSettings(windowId);
            } catch (error) {
                console.error('[MediaCenter] Error adding folder:', error);
            }
        }
    }

    static renderMedia(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const grid = win.querySelector('.mc-grid');
        const emptyState = win.querySelector('.mc-empty-state');
        const searchQuery = win.querySelector('.mc-search-input').value.toLowerCase();

        let items = [...state.library];

        if (state.currentFilter.startsWith('folder:')) {
            const folderPath = state.currentFilter.replace('folder:', '');
            items = items.filter(m => m.folder.startsWith(folderPath));
            win.querySelector('.mc-view-title').textContent = folderPath.split('/').pop();
        } else if (state.currentFilter !== 'all') {
            items = items.filter(m => m.type === state.currentFilter);
            const titles = { music: 'Music', video: 'Videos', photo: 'Photos' };
            win.querySelector('.mc-view-title').textContent = titles[state.currentFilter] || 'All Media';
        } else {
            win.querySelector('.mc-view-title').textContent = 'All Media';
        }

        if (searchQuery) {
            items = items.filter(m =>
                m.name.toLowerCase().includes(searchQuery) ||
                m.filename.toLowerCase().includes(searchQuery)
            );
        }

        items.sort((a, b) => {
            let aVal, bVal;
            switch (state.sortBy) {
                case 'date': aVal = new Date(a.modified); bVal = new Date(b.modified); break;
                case 'size': aVal = a.size; bVal = b.size; break;
                default: aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase();
            }
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        });

        state.playlist = items;
        win.querySelector('.mc-item-count').textContent = `${items.length} items`;

        if (items.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        grid.className = `mc-grid mc-grid-${state.viewMode}`;
        grid.style.display = state.viewMode === 'list' ? 'flex' : 'grid';

        if (state.viewMode === 'list') {
            grid.innerHTML = items.map((item, index) => {
                const typeIcon = item.type === 'music' ? 'music-notes' : item.type === 'video' ? 'film-strip' : 'image';
                const typeColor = item.type === 'music' ? '#1db954' : item.type === 'video' ? '#a142f4' : '#d93025';

                return `
                    <div class="mc-list-item" data-index="${index}">
                        <div class="mc-list-icon" style="color:${typeColor}"><i class="ph ph-${typeIcon}"></i></div>
                        <div class="mc-list-name">${item.name}</div>
                        <div class="mc-list-folder">${item.folder.split('/').pop()}</div>
                        <div class="mc-list-size">${item.sizeFormatted}</div>
                        <div class="mc-list-date">${item.modifiedFormatted || ''}</div>
                    </div>
                `;
            }).join('');
        } else {
            grid.innerHTML = items.map((item, index) => {
                const thumbUrl = item.type === 'photo' ? this.getMediaUrl(item.path, 'thumbnail') : '';
                const typeIcon = item.type === 'music' ? 'music-notes' : item.type === 'video' ? 'film-strip' : 'image';

                return `
                    <div class="mc-item mc-item-${item.type}" data-index="${index}">
                        <div class="mc-item-thumb">
                            ${item.type === 'photo'
                        ? `<img src="${thumbUrl}" alt="" loading="lazy">`
                        : `<i class="ph ph-${typeIcon}"></i>`
                    }
                            <div class="mc-item-overlay"><i class="ph ph-play-fill"></i></div>
                        </div>
                        <div class="mc-item-info">
                            <div class="mc-item-name">${item.name}</div>
                            <div class="mc-item-meta">${item.sizeFormatted}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        grid.querySelectorAll('[data-index]').forEach(item => {
            item.onclick = () => {
                const index = parseInt(item.dataset.index);
                this.playMedia(windowId, index);
            };
        });
    }

    static playMedia(windowId, index, fromViewer = false) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const item = state.playlist[index];
        if (!item) return;

        const wasInViewer = state.displayMode === 'viewer';

        state.currentIndex = index;
        state.currentItem = item;
        state.currentMediaType = item.type;

        state.audioElement.pause();
        state.audioElement.src = '';
        state.videoElement.pause();
        state.videoElement.src = '';
        state.isPlaying = false;

        const audioVisual = win.querySelector('.mc-audio-visual');
        if (audioVisual) audioVisual.style.display = 'none';

        win.querySelector('.mc-player-title').textContent = item.name;
        win.querySelector('.mc-player-artist').textContent = item.folder.split('/').pop();

        const thumb = win.querySelector('.mc-player-thumb');
        if (item.type === 'photo') {
            thumb.innerHTML = `<img src="${this.getMediaUrl(item.path, 'thumbnail')}" alt="">`;
        } else if (item.type === 'music') {
            thumb.innerHTML = `<i class="ph ph-music-notes"></i>`;
        } else {
            thumb.innerHTML = `<i class="ph ph-film-strip"></i>`;
        }

        win.querySelector('.mc-time-current').textContent = '0:00';
        win.querySelector('.mc-time-total').textContent = '0:00';
        win.querySelector('.mc-progress-fill').style.width = '0%';

        if (item.type === 'music') {
            state.audioElement.src = this.getMediaUrl(item.path);
            state.audioElement.volume = state.volume;
            state.audioElement.play();

            if (wasInViewer || fromViewer) {
                this.showMusicViewer(windowId, item);
            }
        } else if (item.type === 'video') {
            this.showViewer(windowId, item);
        } else {
            this.showViewer(windowId, item);
        }

        this.updatePlayButton(windowId);
    }

    static togglePlay(windowId) {
        const state = this.instances.get(windowId);

        let activeMedia;
        if (state.currentMediaType === 'music') {
            activeMedia = state.audioElement;
        } else if (state.currentMediaType === 'video') {
            activeMedia = state.videoElement;
        } else {
            return;
        }

        if (!activeMedia || !activeMedia.src) return;

        if (activeMedia.paused) {
            activeMedia.play();
        } else {
            activeMedia.pause();
        }
    }

    static updatePlayButton(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;
        const state = this.instances.get(windowId);
        win.querySelector('.mc-btn-play i').className = state.isPlaying ? 'ph ph-pause' : 'ph ph-play';
    }

    static playPrevious(windowId) {
        const state = this.instances.get(windowId);
        if (state.currentIndex > 0) {
            this.playMedia(windowId, state.currentIndex - 1);
        } else if (state.repeat === 'all') {
            this.playMedia(windowId, state.playlist.length - 1);
        }
    }

    static playNext(windowId) {
        const state = this.instances.get(windowId);
        if (state.shuffle && state.playQueue.length > 0) {
            this.playMedia(windowId, state.playQueue.shift());
            return;
        }
        if (state.currentIndex < state.playlist.length - 1) {
            this.playMedia(windowId, state.currentIndex + 1);
        } else if (state.repeat === 'all') {
            this.playMedia(windowId, 0);
        }
    }

    static shuffleQueue(windowId) {
        const state = this.instances.get(windowId);
        const playableItems = state.playlist.map((_, i) => i).filter(i => i !== state.currentIndex);
        for (let i = playableItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playableItems[i], playableItems[j]] = [playableItems[j], playableItems[i]];
        }
        state.playQueue = playableItems;
    }

    static handleMediaEnd(windowId) {
        const state = this.instances.get(windowId);
        if (state.repeat === 'one') {
            const activeMedia = state.audioElement.src ? state.audioElement : state.videoElement;
            activeMedia.currentTime = 0;
            activeMedia.play();
        } else {
            this.playNext(windowId);
        }
    }

    static updateProgress(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const activeMedia = state.audioElement.src ? state.audioElement : state.videoElement;

        if (!activeMedia || !activeMedia.duration) return;

        const percent = (activeMedia.currentTime / activeMedia.duration) * 100;
        win.querySelector('.mc-progress-fill').style.width = `${percent}%`;
        win.querySelector('.mc-time-current').textContent = this.formatTime(activeMedia.currentTime);
    }

    static updateVolumeUI(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        win.querySelector('.mc-volume-fill').style.width = `${state.volume * 100}%`;

        const icon = win.querySelector('.mc-btn-volume i');
        if (state.volume === 0) icon.className = 'ph ph-speaker-x';
        else if (state.volume < 0.5) icon.className = 'ph ph-speaker-low';
        else icon.className = 'ph ph-speaker-high';
    }

    static formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
