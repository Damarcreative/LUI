import './style.css';
import { WindowManager } from '../WindowManager/WindowManager.js';
import { AppRegistry } from '../../lib/AppRegistry.js';

export class Taskbar {
    static currentCalendarDate = new Date();

    static mount(container) {
        const html = `
            <div id="ui-layer">
                <div class="taskbar">
                    <div class="taskbar-icon" id="start-btn" title="Start">
                        <i class="ph ph-list"></i>
                    </div>

                    <div class="taskbar-center">
                        <div class="taskbar-pinned" id="taskbar-pinned"></div>
                        <div class="taskbar-dynamic" id="taskbar-dynamic"></div>
                    </div>

                    <div class="tray-area">
                        <div class="tray-clock" id="tray-clock">
                            <div id="clock-time" style="font-weight:600; font-size:14px;">12:00</div>
                            <div id="clock-date" style="font-size:10px; opacity:0.7">10 Oct</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="start-menu" class="popup-menu start-menu-enhanced">
                <div class="start-profile">
                    <div class="profile-avatar">
                        <i class="ph ph-user-circle"></i>
                    </div>
                    <div class="profile-info">
                        <div class="profile-name">User</div>
                        <div class="profile-status">Local Account</div>
                    </div>
                    <button class="profile-lock-btn" id="lock-btn" title="Lock Screen">
                        <i class="ph ph-lock"></i>
                    </button>
                </div>

                <div class="start-search">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="app-search" placeholder="Search apps..." autocomplete="off" />
                </div>

                <div class="start-apps-section">
                    <div class="start-section-title">Applications</div>
                    <div class="app-grid-container" id="app-grid"></div>
                </div>
            </div>



            <div id="calendar-popup" class="popup-menu calendar-popup-enhanced">
                <div class="datetime-header">
                    <div class="datetime-time" id="popup-time">23:02</div>
                    <div class="datetime-info">
                        <div class="datetime-date" id="popup-fulldate">Thursday, January 9, 2026</div>
                        <div class="datetime-week" id="popup-week">Week 2</div>
                    </div>
                </div>
                
                <div class="cal-section">
                    <div class="cal-header">
                        <h3 id="cal-month-year" style="margin:0;">January 2026</h3>
                        <div style="display:flex; gap:10px;">
                            <span id="cal-prev" style="cursor:pointer; opacity:0.7; padding:0 5px;"><i class="ph ph-caret-left"></i></span>
                            <span id="cal-next" style="cursor:pointer; opacity:0.7; padding:0 5px;"><i class="ph ph-caret-right"></i></span>
                        </div>
                    </div>
                    <div class="cal-grid">
                        <div class="cal-day-name">Su</div>
                        <div class="cal-day-name">Mo</div>
                        <div class="cal-day-name">Tu</div>
                        <div class="cal-day-name">We</div>
                        <div class="cal-day-name">Th</div>
                        <div class="cal-day-name">Fr</div>
                        <div class="cal-day-name">Sa</div>
                    </div>
                    <div id="cal-grid-days" class="cal-grid" style="margin-top:5px;"></div>
                </div>

                <div class="notes-section">
                    <div class="notes-header">
                        <span>Quick Notes</span>
                        <button class="notes-add-btn" id="notes-add-btn" title="Add Note"><i class="ph ph-plus"></i></button>
                    </div>
                    <div id="notes-list" class="notes-list">
                        <div class="note-item">
                            <span class="note-text">Meeting at 3pm</span>
                            <span class="note-delete" data-id="1"><i class="ph ph-x"></i></span>
                        </div>
                        <div class="note-item">
                            <span class="note-text">Review project files</span>
                            <span class="note-delete" data-id="2"><i class="ph ph-x"></i></span>
                        </div>
                    </div>
                    <input type="text" id="notes-input" class="notes-input" placeholder="Type a note and press Enter..." autocomplete="off" style="display:none;">
                </div>
            </div>

            <div id="app-context-menu" class="dropdown-menu" style="position:fixed; z-index:30000; width:200px;">
                <div class="dropdown-item" data-action="open-app">
                    <i class="ph ph-arrow-square-out" style="margin-right:8px; color:#666;"></i>
                    Open
                </div>
                <div class="dropdown-item" data-action="new-window">
                    <i class="ph ph-plus" style="margin-right:8px; color:#666;"></i>
                    New Window
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="add-desktop">
                    <i class="ph ph-desktop" style="margin-right:8px; color:#666;"></i>
                    Add to Desktop
                </div>
                <div class="dropdown-item" data-action="add-taskbar">
                    <i class="ph ph-push-pin" style="margin-right:8px; color:#666;"></i>
                    Pin to Taskbar
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="run-as-admin">
                    <i class="ph ph-shield" style="margin-right:8px; color:#666;"></i>
                    Run as Admin
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="app-info">
                    <i class="ph ph-info" style="margin-right:8px; color:#666;"></i>
                    App Info
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        this.renderPinnedTaskbar();
        this.renderStartMenuApps();
        this.attachListeners();
        this.startClock();
        this.renderCalendar(this.currentCalendarDate);
        this.setupWindowListeners();
        this.syncUserProfile();
    }

    static attachListeners() {
        const appIcons = document.querySelectorAll('.taskbar-center .taskbar-icon');
        appIcons.forEach(icon => {
            const app = icon.dataset.app;
            if (!app) return;

            const popup = document.createElement('div');
            popup.className = 'window-preview-popup';
            popup.id = `preview-${app}`;
            icon.appendChild(popup);

            icon.addEventListener('click', (e) => {
                if (e.target.closest('.window-preview-popup')) return;
                this.closeAllPopups();

                const instances = WindowManager.getInstances(app);
                if (instances.length > 0) {
                    this.showWindowPreview(app, popup, true);
                } else {
                    this.openNewAppWindow(app);
                }
            });

            icon.addEventListener('dblclick', (e) => {
                if (e.target.closest('.window-preview-popup')) return;
                e.preventDefault();
                e.stopPropagation();
                popup.classList.remove('show');
                this.openNewAppWindow(app);
            });

            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectedAppCard = { dataset: { app: app, name: this.getAppName(app) } };
                this.showAppContextMenu(e, icon);
            });

            icon.addEventListener('mouseenter', () => {
                this.showWindowPreview(app, popup, false);
            });

            icon.addEventListener('mouseleave', () => {
                if (!popup.dataset.forceOpen) {
                    popup.classList.remove('show');
                }
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.togglePopup('start-menu');
        });



        document.getElementById('tray-clock').addEventListener('click', () => {
            this.togglePopup('calendar-popup');
        });

        document.querySelectorAll('#start-menu .app-card').forEach(card => {
            card.addEventListener('click', () => {
                const app = card.dataset.app;
                if (app) {
                    this.closeAllPopups();
                    const instances = WindowManager.getInstances(app);
                    if (instances.length > 0) {
                        WindowManager.focusWindow(instances[0].id);
                    } else {
                        this.openNewAppWindow(app);
                    }
                }
            });

            card.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const app = card.dataset.app;
                if (app) {
                    this.closeAllPopups();
                    this.openNewAppWindow(app);
                }
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectedAppCard = card;
                this.showAppContextMenu(e, card);
            });
        });

        document.querySelectorAll('#app-context-menu .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAppContextAction(item.dataset.action);
            });
        });

        document.getElementById('cal-prev').addEventListener('click', () => this.prevMonth());
        document.getElementById('cal-next').addEventListener('click', () => this.nextMonth());

        const appSearch = document.getElementById('app-search');
        if (appSearch) {
            appSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                document.querySelectorAll('#app-grid .app-card').forEach(card => {
                    const appName = card.dataset.name?.toLowerCase() || '';
                    if (query === '' || appName.includes(query)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        }

        const lockBtn = document.getElementById('lock-btn');
        if (lockBtn) {
            lockBtn.addEventListener('click', async () => {
                this.closeAllPopups();
                const { LockScreen } = await import('../LockScreen/LockScreen.js');
                await LockScreen.performLock();
            });
        }

        document.getElementById('notes-add-btn').addEventListener('click', () => {
            const input = document.getElementById('notes-input');
            input.style.display = input.style.display === 'none' ? 'block' : 'none';
            if (input.style.display === 'block') input.focus();
        });

        document.getElementById('notes-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.addNote(e.target.value.trim());
                e.target.value = '';
                e.target.style.display = 'none';
            }
        });

        document.getElementById('notes-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('note-delete')) {
                e.target.parentElement.remove();
            }
        });

        document.addEventListener('click', () => {
            document.getElementById('app-context-menu').classList.remove('show');
        });

        document.getElementById('desktop')?.addEventListener('mousedown', () => {
            this.closeAllPopups();
        });
    }

    static addNote(text) {
        const list = document.getElementById('notes-list');
        const note = document.createElement('div');
        note.className = 'note-item';
        note.innerHTML = `
            <span class="note-text">${text}</span>
            <span class="note-delete">×</span>
        `;
        list.appendChild(note);
    }

    static closeAllPopups() {
        document.querySelectorAll('.popup-menu').forEach(p => p.style.display = 'none');
    }

    static showWindowPreview(appType, popup, forceOpen = false) {
        const instances = WindowManager.getInstances(appType);

        if (forceOpen) {
            popup.dataset.forceOpen = 'true';
            const closeHandler = (e) => {
                if (!popup.contains(e.target) && !e.target.closest('.taskbar-icon')) {
                    popup.classList.remove('show');
                    delete popup.dataset.forceOpen;
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        } else {
            delete popup.dataset.forceOpen;
        }

        if (!forceOpen && instances.length <= 1) {
            popup.classList.remove('show');
            return;
        }

        if (instances.length === 0) {
            popup.classList.remove('show');
            return;
        }

        let html = instances.map(inst => {
            let subtitle = '';
            if (appType === 'explorer') {
                const explorerState = this.getExplorerInstancePath(inst.id);
                subtitle = explorerState ? `<span class="window-preview-path">${explorerState}</span>` : '';
            } else if (appType === 'texteditor') {
                const match = inst.title.match(/^(?:• )?(.+?) - Text Editor$/);
                if (match) {
                    subtitle = `<span class="window-preview-path">${match[1]}</span>`;
                }
            }

            return `
                <div class="window-preview-item ${inst.minimized ? 'minimized' : ''}" data-window-id="${inst.id}">
                    <div class="window-preview-info">
                        <span class="window-preview-title">${inst.title}</span>
                        ${subtitle}
                    </div>
                    <span class="window-preview-close" data-close-id="${inst.id}">
                        <svg viewBox="0 0 10 10"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
                    </span>
                </div>
            `;
        }).join('');

        html += `
            <div class="window-preview-divider"></div>
            <div class="window-preview-new" data-new-app="${appType}">
                <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                New Window
            </div>
        `;

        popup.innerHTML = html;

        popup.querySelectorAll('.window-preview-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.window-preview-close')) return;
                WindowManager.focusWindow(item.dataset.windowId);
                popup.classList.remove('show');
                delete popup.dataset.forceOpen;
            });
        });

        popup.querySelectorAll('.window-preview-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                WindowManager.closeWindow(btn.dataset.closeId, appType);
                setTimeout(() => this.showWindowPreview(appType, popup, forceOpen), 50);
            });
        });

        popup.querySelector('.window-preview-new')?.addEventListener('click', () => {
            popup.classList.remove('show');
            delete popup.dataset.forceOpen;
            this.openNewAppWindow(appType);
        });

        popup.classList.add('show');
    }

    static getExplorerInstancePath(windowId) {
        try {
            const win = document.getElementById(windowId);
            if (!win) return null;

            const breadcrumb = win.querySelector('.exp-breadcrumb-path');
            if (breadcrumb) {
                return breadcrumb.textContent?.trim() || '/';
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    static async openNewAppWindow(appType) {
        const { AppRegistry } = await import('../../lib/AppRegistry.js');
        await AppRegistry.launch(appType);
    }

    static getAppName(appId) {
        const names = {
            'explorer': 'File Explorer',
            'texteditor': 'Text Editor',
            'cli': 'Terminal',
            'settings': 'Settings',
            'taskmanager': 'Task Manager',
            'media-app': 'Media Center'
        };
        return names[appId] || appId;
    }

    static togglePopup(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const isVisible = el.style.display === 'block';
        this.closeAllPopups();
        if (!isVisible) {
            el.style.display = 'block';
        }
    }

    static startClock() {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const update = () => {
            const now = new Date();
            const timeEl = document.getElementById('clock-time');
            const dateEl = document.getElementById('clock-date');
            const popupTimeEl = document.getElementById('popup-time');
            const popupDateEl = document.getElementById('popup-fulldate');
            const popupWeekEl = document.getElementById('popup-week');

            const hours24 = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const sec = String(now.getSeconds()).padStart(2, '0');

            if (timeEl) {
                timeEl.innerText = `${hours24}:${min}`;
            }
            if (dateEl) {
                dateEl.innerText = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            if (popupTimeEl) {
                popupTimeEl.innerText = `${hours24}:${min}:${sec}`;
            }
            if (popupDateEl) {
                popupDateEl.innerText = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
            }
            if (popupWeekEl) {
                const weekNum = Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
                popupWeekEl.innerText = `Week ${weekNum} • Day ${now.getDate()} of ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
            }
        };
        update();
        setInterval(update, 1000);
    }

    static renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        document.getElementById('cal-month-year').innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calGrid = document.getElementById('cal-grid-days');
        calGrid.innerHTML = '';

        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDay; i++) {
            const d = document.createElement('div');
            d.className = 'cal-day inactive';
            d.innerText = prevMonthDays - firstDay + 1 + i;
            calGrid.appendChild(d);
        }

        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = document.createElement('div');
            d.className = 'cal-day';
            d.innerText = i;
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                d.classList.add('today');
            }
            calGrid.appendChild(d);
        }

        const totalCells = firstDay + daysInMonth;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const d = document.createElement('div');
            d.className = 'cal-day inactive';
            d.innerText = i;
            calGrid.appendChild(d);
        }
    }

    static prevMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendar(this.currentCalendarDate);
    }

    static nextMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendar(this.currentCalendarDate);
    }

    static showAppContextMenu(e, card) {
        const menu = document.getElementById('app-context-menu');
        menu.classList.remove('show');

        const menuWidth = 200;
        const menuHeight = 250;

        let x = e.pageX;
        let y = e.pageY;

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }

        if (y + menuHeight > window.innerHeight - 50) {
            y = y - menuHeight;
        }

        if (x < 0) x = 10;
        if (y < 0) y = 10;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('show');
    }

    static async handleAppContextAction(action) {
        const menu = document.getElementById('app-context-menu');
        menu.classList.remove('show');

        if (!this.selectedAppCard) return;
        const appId = this.selectedAppCard.dataset.app;
        const appName = this.selectedAppCard.dataset.name || appId;
        const { DialogService } = await import('../../lib/DialogService.js');

        switch (action) {
            case 'open-app':
                this.closeAllPopups();
                this.openNewAppWindow(appId);
                break;

            case 'new-window':
                this.closeAllPopups();
                this.openNewAppWindow(appId);
                break;

            case 'add-desktop':
                this.addIconToDesktop(appId, appName);
                break;

            case 'add-taskbar':
                await DialogService.alert(`"${appName}" pinned to taskbar`, { title: 'Pinned', type: 'success' });
                break;

            case 'run-as-admin':
                this.closeAllPopups();
                this.openNewAppWindow(appId);
                await DialogService.alert(`Running "${appName}" as administrator`, { title: 'Admin Mode', type: 'info' });
                break;

            case 'app-info':
                await DialogService.alert(`Name: ${appName}\nID: ${appId}\nVersion: 1.0.0\nPublisher: System`, { title: 'App Info', type: 'info' });
                break;
        }
        this.selectedAppCard = null;
    }

    static async addIconToDesktop(appId, appName) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;
        const { DialogService } = await import('../../lib/DialogService.js');

        if (desktop.querySelector(`.desktop-icon[data-app="${appId}"]`)) {
            await DialogService.alert(`"${appName}" already exists on desktop`, { title: 'Already Exists', type: 'warning' });
            return;
        }

        const GRID_SIZE = 100;
        const MAX_COLS = 2;
        const MAX_ROWS = 10;

        const occupiedCells = new Set();
        desktop.querySelectorAll('.desktop-icon').forEach(icon => {
            const grid = icon.dataset.grid;
            if (grid) {
                occupiedCells.add(grid);
            } else {
                const left = parseInt(icon.style.left) || 0;
                const top = parseInt(icon.style.top) || 0;
                const col = Math.floor(left / GRID_SIZE);
                const row = Math.floor(top / GRID_SIZE);
                occupiedCells.add(`${col},${row}`);
            }
        });

        let foundCol = 0, foundRow = 0;
        outer: for (let col = 0; col < MAX_COLS; col++) {
            for (let row = 0; row < MAX_ROWS; row++) {
                if (!occupiedCells.has(`${col},${row}`)) {
                    foundCol = col;
                    foundRow = row;
                    break outer;
                }
            }
        }

        const iconColors = {
            'explorer': '#e8b339',
            'texteditor': '#1976d2',
            'settings': '#aaa',
            'cli': '#333',
            'taskmanager': '#4caf50',
            'media-app': '#ff4081'
        };
        const color = iconColors[appId] || '#666';

        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.app = appId;
        icon.dataset.grid = `${foundCol},${foundRow}`;
        icon.innerHTML = `
            <svg viewBox="0 0 24 24" style="fill:${color}">
                <rect width="20" height="20" x="2" y="2" rx="4" fill="${color}"/>
            </svg>
            <span>${appName}</span>
        `;
        icon.style.position = 'absolute';
        icon.style.left = (foundCol * GRID_SIZE + 20) + 'px';
        icon.style.top = (foundRow * GRID_SIZE + 20) + 'px';

        icon.addEventListener('dblclick', () => this.openNewAppWindow(appId));
        desktop.appendChild(icon);
    }

    static renderPinnedTaskbar() {
        const container = document.getElementById('taskbar-pinned');
        if (!container) return;

        const pinnedApps = AppRegistry.getTaskbarApps();
        container.innerHTML = pinnedApps.map(app => `
            <div class="taskbar-icon" id="icon-${app.id}" data-app="${app.id}" title="${app.name}">
                <i class="ph ${this.getPhosphorIcon(app.id)}"></i>
            </div>
        `).join('');
    }

    static renderStartMenuApps() {
        const grid = document.getElementById('app-grid');
        if (!grid) return;

        const apps = AppRegistry.getAllApps();
        grid.innerHTML = apps.map(app => `
            <div class="app-card" data-app="${app.id}" data-name="${app.name}">
                <div class="app-icon-bg" style="background:${app.color || '#666'}; color:white;">
                    <i class="ph ${this.getPhosphorIcon(app.id)}" style="font-size:28px;"></i>
                </div>
                <div class="app-name">${app.shortName || app.name}</div>
            </div>
        `).join('');

        this.attachAppCardListeners();
    }

    static attachAppCardListeners() {
        document.querySelectorAll('#app-grid .app-card').forEach(card => {
            card.addEventListener('click', () => {
                const app = card.dataset.app;
                if (app) {
                    this.closeAllPopups();
                    const instances = WindowManager.getInstances(app);
                    if (instances.length > 0) {
                        WindowManager.focusWindow(instances[0].id);
                    } else {
                        this.openNewAppWindow(app);
                    }
                }
            });

            card.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const app = card.dataset.app;
                if (app) {
                    this.closeAllPopups();
                    this.openNewAppWindow(app);
                }
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectedAppCard = card;
                this.showAppContextMenu(e, card);
            });
        });
    }

    static async syncUserProfile() {
        let username = 'User';
        let status = 'Local Account';

        try {
            const res = await fetch('/api/settings/user');
            const data = await res.json();
            if (data.success && data.user) {
                username = data.user.name || username;
                status = data.user.status || status;
            }
        } catch (e) {
            console.log('[Taskbar] Using default user profile');
        }

        const profileName = document.querySelector('.start-profile .profile-name');
        const profileStatus = document.querySelector('.start-profile .profile-status');
        if (profileName) profileName.textContent = username;
        if (profileStatus) profileStatus.textContent = status;

        const lsUsername = document.querySelector('.ls-username');
        if (lsUsername) lsUsername.textContent = username;
    }

    static getPhosphorIcon(appId) {
        const icons = {
            'explorer': 'ph-folder',
            'texteditor': 'ph-file-text',
            'settings': 'ph-gear',
            'cli': 'ph-terminal-window',
            'taskmanager': 'ph-chart-line',
            'media-app': 'ph-play-circle',
            'game2048': 'ph-game-controller'
        };
        return icons[appId] || 'ph-app-window';
    }

    static setupWindowListeners() {
        document.addEventListener('window:created', (e) => {
            const { appType } = e.detail || {};
            if (appType) {
                this.updateTaskbarIndicators();
                this.addDynamicIcon(appType);
            }
        });

        document.addEventListener('window:closed', (e) => {
            const { appType } = e.detail || {};
            if (appType) {
                this.updateTaskbarIndicators();
                this.removeDynamicIconIfNeeded(appType);
            }
        });
    }

    static addDynamicIcon(appType) {
        const pinnedIcon = document.getElementById(`icon-${appType}`);
        if (pinnedIcon) return;

        const dynamicContainer = document.getElementById('taskbar-dynamic');
        if (!dynamicContainer) return;

        if (dynamicContainer.querySelector(`[data-app="${appType}"]`)) return;

        const app = AppRegistry.getApp(appType);
        if (!app) return;

        const icon = document.createElement('div');
        icon.className = 'taskbar-icon open';
        icon.id = `dynamic-icon-${appType}`;
        icon.dataset.app = appType;
        icon.title = app.name;
        icon.innerHTML = `<i class="ph ${this.getPhosphorIcon(appType)}"></i>`;

        const popup = document.createElement('div');
        popup.className = 'window-preview-popup';
        popup.id = `preview-${appType}`;
        icon.appendChild(popup);

        this.attachIconListeners(icon, appType, popup);
        dynamicContainer.appendChild(icon);
    }

    static removeDynamicIconIfNeeded(appType) {
        const instances = WindowManager.getInstances(appType);
        if (instances.length === 0) {
            const dynamicIcon = document.getElementById(`dynamic-icon-${appType}`);
            if (dynamicIcon) {
                dynamicIcon.remove();
            }
        }
    }

    static attachIconListeners(icon, appType, popup) {
        icon.addEventListener('click', (e) => {
            if (e.target.closest('.window-preview-popup')) return;
            this.closeAllPopups();

            const instances = WindowManager.getInstances(appType);
            if (instances.length > 0) {
                this.showWindowPreview(appType, popup, true);
            } else {
                this.openNewAppWindow(appType);
            }
        });

        icon.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-preview-popup')) return;
            e.preventDefault();
            e.stopPropagation();
            popup.classList.remove('show');
            this.openNewAppWindow(appType);
        });

        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectedAppCard = { dataset: { app: appType, name: this.getAppName(appType) } };
            this.showAppContextMenu(e, icon);
        });

        icon.addEventListener('mouseenter', () => {
            this.showWindowPreview(appType, popup, false);
        });

        icon.addEventListener('mouseleave', () => {
            if (!popup.dataset.forceOpen) {
                popup.classList.remove('show');
            }
        });
    }
}
