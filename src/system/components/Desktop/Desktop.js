import './style.css';
import { WindowManager } from '../WindowManager/WindowManager.js';
import { AppRegistry } from '../../lib/AppRegistry.js';

export class Desktop {
    static GRID_SIZE = 100;
    static GRID_COLS = 20;
    static GRID_ROWS = 10;
    static occupiedCells = new Set();
    static draggedIcon = null;
    static dragOffset = { x: 0, y: 0 };

    static mount(container) {

        const apps = AppRegistry.getDesktopApps();
        let iconsHtml = '';
        apps.forEach((app, index) => {
            iconsHtml += AppRegistry.generateDesktopIcon(app, 0, index);
        });

        const html = `
            <div id="desktop">
                ${iconsHtml}
            </div>

            <div id="desktop-context-menu" class="dropdown-menu" style="position:fixed; z-index:20000; width:200px;">
                <div class="dropdown-item" data-action="new-folder">
                    <i class="ph ph-folder-plus" style="margin-right:8px; color:#666;"></i>
                    New Folder
                </div>
                <div class="dropdown-item" data-action="new-file">
                    <i class="ph ph-file-plus" style="margin-right:8px; color:#666;"></i>
                    New Text File
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="open-terminal">
                    <i class="ph ph-terminal-window" style="margin-right:8px; color:#666;"></i>
                    Open Terminal
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="arrange-icons">
                    <i class="ph ph-grid-four" style="margin-right:8px; color:#666;"></i>
                    Arrange Icons
                </div>
                <div class="dropdown-item" data-action="refresh">
                    <i class="ph ph-arrows-clockwise" style="margin-right:8px; color:#666;"></i>
                    Refresh
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="display-settings">
                    <i class="ph ph-monitor" style="margin-right:8px; color:#666;"></i>
                    Display Settings
                </div>
                <div class="dropdown-item" data-action="personalize">
                    <i class="ph ph-palette" style="margin-right:8px; color:#666;"></i>
                    Personalize
                </div>
            </div>

            <div id="icon-context-menu" class="dropdown-menu" style="position:fixed; z-index:20001; width:180px;">
                <div class="dropdown-item" data-action="open-icon">
                    <i class="ph ph-folder-open" style="margin-right:8px; color:#666;"></i>
                    Open
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="rename-icon">
                    <i class="ph ph-pencil" style="margin-right:8px; color:#666;"></i>
                    Rename
                </div>
                <div class="dropdown-item" data-action="delete-icon" style="color:#d32f2f;">
                    <i class="ph ph-trash" style="margin-right:8px; color:#d32f2f;"></i>
                    Delete
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" data-action="icon-properties">
                    <i class="ph ph-info" style="margin-right:8px; color:#666;"></i>
                    Properties
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        this.initializeGrid();
        this.attachListeners();
    }

    static initializeGrid() {
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            const gridData = icon.dataset.grid;
            if (gridData) {
                const [col, row] = gridData.split(',').map(Number);
                this.placeIconAtGrid(icon, col, row);
                this.occupiedCells.add(`${col},${row}`);
            }
        });
    }

    static placeIconAtGrid(icon, col, row) {
        icon.style.left = (20 + col * this.GRID_SIZE) + 'px';
        icon.style.top = (20 + row * this.GRID_SIZE) + 'px';
        icon.dataset.grid = `${col},${row}`;
    }

    static getGridFromPosition(x, y) {
        const col = Math.floor((x - 20) / this.GRID_SIZE);
        const row = Math.floor((y - 20) / this.GRID_SIZE);
        return { col: Math.max(0, col), row: Math.max(0, row) };
    }

    static findNearestFreeCell(col, row) {

        if (!this.occupiedCells.has(`${col},${row}`)) {
            return { col, row };
        }

        for (let r = 1; r < 20; r++) {
            for (let dc = -r; dc <= r; dc++) {
                for (let dr = -r; dr <= r; dr++) {
                    if (Math.abs(dc) === r || Math.abs(dr) === r) {
                        const nc = col + dc;
                        const nr = row + dr;
                        if (nc >= 0 && nr >= 0 && !this.occupiedCells.has(`${nc},${nr}`)) {
                            return { col: nc, row: nr };
                        }
                    }
                }
            }
        }
        return { col, row };
    }

    static attachListeners() {
        const desktop = document.getElementById('desktop');
        const contextMenu = document.getElementById('desktop-context-menu');


        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', async (e) => {
                e.stopPropagation();
                const appId = icon.dataset.app;
                if (appId) {
                    await AppRegistry.launch(appId);
                }
            });


            icon.addEventListener('click', (e) => {
                e.stopPropagation();


                const now = new Date().getTime();
                if (icon.dataset.lastClick && (now - parseInt(icon.dataset.lastClick)) < 500) {
                    const appId = icon.dataset.app;
                    if (appId) AppRegistry.launch(appId);
                    icon.dataset.lastClick = '0';
                    return;
                }
                icon.dataset.lastClick = now.toString();

                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            });


            icon.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;

                const startX = e.clientX;
                const startY = e.clientY;
                const rect = icon.getBoundingClientRect();
                this.dragOffset.x = e.clientX - rect.left;
                this.dragOffset.y = e.clientY - rect.top;
                this.potentialDrag = icon;
                this.dragStartPos = { x: startX, y: startY };


                const oldGrid = icon.dataset.grid;
                this.pendingGridRemove = oldGrid;
            });
        });


        document.addEventListener('mousemove', (e) => {
            if (this.potentialDrag && !this.draggedIcon) {
                const dx = Math.abs(e.clientX - this.dragStartPos.x);
                const dy = Math.abs(e.clientY - this.dragStartPos.y);
                if (dx > 5 || dy > 5) {

                    this.draggedIcon = this.potentialDrag;
                    this.draggedIcon.classList.add('dragging');
                    if (this.pendingGridRemove) {
                        this.occupiedCells.delete(this.pendingGridRemove);
                    }
                }
            }

            if (!this.draggedIcon) return;
            this.draggedIcon.style.left = (e.clientX - this.dragOffset.x) + 'px';
            this.draggedIcon.style.top = (e.clientY - this.dragOffset.y) + 'px';
        });


        document.addEventListener('mouseup', (e) => {
            this.potentialDrag = null;
            this.pendingGridRemove = null;

            if (!this.draggedIcon) return;

            const icon = this.draggedIcon;
            icon.classList.remove('dragging');

            const rect = icon.getBoundingClientRect();
            const { col, row } = this.getGridFromPosition(rect.left, rect.top);
            const free = this.findNearestFreeCell(col, row);

            this.placeIconAtGrid(icon, free.col, free.row);
            this.occupiedCells.add(`${free.col},${free.row}`);

            this.draggedIcon = null;
        });


        desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.closeAllMenus();


            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                this.selectedIcon = icon;
                const iconMenu = document.getElementById('icon-context-menu');
                iconMenu.style.left = e.pageX + 'px';
                iconMenu.style.top = e.pageY + 'px';
                iconMenu.classList.add('show');
            } else {

                contextMenu.style.left = e.pageX + 'px';
                contextMenu.style.top = e.pageY + 'px';
                contextMenu.classList.add('show');
            }
        });


        document.addEventListener('click', () => {
            this.closeAllMenus();
        });


        contextMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleContextAction(item.dataset.action);
                this.closeAllMenus();
            });
        });


        const iconMenu = document.getElementById('icon-context-menu');
        iconMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleIconAction(item.dataset.action);
                this.closeAllMenus();
            });
        });
    }

    static closeAllMenus() {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    }

    static async handleContextAction(action) {
        const { DialogService } = await import('../../lib/DialogService.js');
        switch (action) {
            case 'new-folder':
                await DialogService.alert('New folder created on desktop', { title: 'New Folder', type: 'success' });
                break;
            case 'new-file':
                await DialogService.alert('New text file created on desktop', { title: 'New File', type: 'success' });
                break;
            case 'open-terminal':
                await AppRegistry.launch('cli');
                break;
            case 'arrange-icons':
                this.arrangeIcons();
                break;
            case 'refresh':
                location.reload();
                break;
            case 'display-settings':
            case 'personalize':
                await AppRegistry.launch('settings');
                break;
        }
    }

    static async handleIconAction(action) {
        if (!this.selectedIcon) return;
        const app = this.selectedIcon.dataset.app;
        const name = this.selectedIcon.querySelector('span')?.innerText || 'Icon';
        const { DialogService } = await import('../../lib/DialogService.js');

        switch (action) {
            case 'open-icon':
                if (app) {
                    await AppRegistry.launch(app);
                }
                break;
            case 'rename-icon': {
                const newName = await DialogService.prompt('Rename to:', name, { title: 'Rename Icon' });
                if (newName) {
                    const label = this.selectedIcon.querySelector('span');
                    if (label) label.innerText = newName;
                }
                break;
            }
            case 'delete-icon': {
                const confirmed = await DialogService.danger(`Delete "${name}"?`, { title: 'Delete Icon', confirmText: 'Delete' });
                if (confirmed) {
                    const grid = this.selectedIcon.dataset.grid;
                    if (grid) this.occupiedCells.delete(grid);
                    this.selectedIcon.remove();
                }
                break;
            }
            case 'icon-properties':
                await DialogService.alert(`Name: ${name}\nApp: ${app || 'None'}\nPosition: ${this.selectedIcon.dataset.grid}`, { title: 'Properties', type: 'info' });
                break;
        }
        this.selectedIcon = null;
    }

    static arrangeIcons() {
        this.occupiedCells.clear();
        const icons = document.querySelectorAll('.desktop-icon');
        let col = 0, row = 0;
        icons.forEach(icon => {
            this.placeIconAtGrid(icon, col, row);
            this.occupiedCells.add(`${col},${row}`);
            row++;
            if (row > 6) { row = 0; col++; }
        });
    }
}
