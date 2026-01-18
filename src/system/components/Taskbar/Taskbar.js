import './style.css';
import { WindowManager } from '../WindowManager/WindowManager.js';

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
                        <div class="taskbar-icon" id="icon-explorer" data-app="explorer" title="File Explorer">
                            <i class="ph ph-folder"></i>
                        </div>
                        <div class="taskbar-icon" id="icon-cli" data-app="cli" title="Terminal">
                            <i class="ph ph-terminal-window"></i>
                        </div>
                        <div class="taskbar-icon" id="icon-settings" data-app="settings" title="Settings">
                            <i class="ph ph-gear"></i>
                        </div>
                        <div class="taskbar-icon" id="icon-taskmanager" data-app="taskmanager" title="Task Manager">
                           <i class="ph ph-chart-line"></i>
                        </div>
                        <div class="taskbar-icon" id="icon-media" data-app="media-app" title="Media Center">
                           <i class="ph ph-play-circle"></i>
                        </div>
                        <div class="taskbar-icon" id="icon-texteditor" data-app="texteditor" title="Text Editor">
                            <i class="ph ph-file-text"></i>
                        </div>
                    </div>

                    <div class="tray-area">
                        <div class="tray-icon" id="tray-network" title="Network">
                            <i class="ph ph-globe"></i>
                        </div>
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
                    <div class="app-grid-container" id="app-grid">
                        <div class="app-card" data-app="explorer" data-name="Explorer">
                            <div class="app-icon-bg" style="background:#e8b339; color:white;">
                                <i class="ph ph-folder" style="font-size:28px;"></i>
                            </div>
                            <div class="app-name">Explorer</div>
                        </div>
                        <div class="app-card" data-app="texteditor" data-name="Text Editor">
                            <div class="app-icon-bg" style="background:#1976d2; color:white;">
                                <i class="ph ph-file-text" style="font-size:28px;"></i>
                            </div>
                            <div class="app-name">Text Edit</div>
                        </div>
                        <div class="app-card" data-app="settings" data-name="Settings">
                            <div class="app-icon-bg" style="background:#aaa; color:white;">
                                <i class="ph ph-gear" style="font-size:28px;"></i>
                            </div>
                            <div class="app-name">Settings</div>
                        </div>
                        <div class="app-card" data-app="cli" data-name="Terminal">
                            <div class="app-icon-bg" style="background:#333; color:white;">
                                <i class="ph ph-terminal-window" style="font-size:28px;"></i>
                            </div>
                            <div class="app-name">Terminal</div>
                        </div>
                        <div class="app-card" data-app="taskmanager" data-name="Task Manager">
                            <div class="app-icon-bg" style="background:#4caf50; color:white;">
                                <i class="ph ph-chart-line" style="font-size:28px;"></i>
                            </div>
                            <div class="app-name">Task Mgr</div>
                        </div>
                        <div class="app-card" data-app="media-app" data-name="Media Center">
                            <div class="app-icon-bg" style="background:#ff4081; color:white;">
                                <i class="ph ph-play-circle" style="font-size:28px;"></i>
                            </div>
                            <div class="app-name">Media</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="control-center" class="popup-menu">
                <h3 style="margin-top:0">Quick Settings</h3>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <div style="width:60px; height:60px; background:#0078d4; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-direction:column; padding:5px; cursor:pointer;">
                        <i class="ph ph-wifi-high" style="font-size:24px; color:white;"></i>
                        <span style="font-size:10px; color:white;">WiFi</span>
                    </div>
                    <div style="width:60px; height:60px; background:#444; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-direction:column; padding:5px; cursor:pointer;">
                        <i class="ph ph-bluetooth" style="font-size:24px; color:white;"></i>
                        <span style="font-size:10px; color:white;">BT</span>
                    </div>
                </div>
                <div class="wifi-list">
                    <div style="font-size:12px; color:#888; margin-bottom:5px;">Available Networks</div>
                    <div class="wifi-item active">
                        <div class="wifi-info">
                            <i class="ph ph-lock wifi-lock"></i>
                            <span>MyHome_5G</span>
                        </div>
                        <i class="ph ph-wifi-high" style="font-size:16px; color:#0078d4;"></i>
                    </div>
                    <div class="wifi-item">
                        <div class="wifi-info">
                            <i class="ph ph-lock wifi-lock"></i>
                            <span>Guest_Network</span>
                        </div>
                        <i class="ph ph-wifi-medium" style="font-size:16px; color:#aaa;"></i>
                    </div>
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
        this.attachListeners();
        this.startClock();
        this.renderCalendar(this.currentCalendarDate);
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

        document.getElementById('tray-network').addEventListener('click', () => {
            this.togglePopup('control-center');
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
            lockBtn.addEventListener('click', () => {
                this.closeAllPopups();
                const lockscreen = document.getElementById('lockscreen');
                if (lockscreen) {
                    lockscreen.style.display = 'flex';
                }
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
}
