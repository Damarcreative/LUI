export class WindowManager {
    static zIndexCounter = 100;
    static isDragging = false;
    static dragData = { startX: 0, startY: 0, initialLeft: 0, initialTop: 0, currentWindow: null };

    static dragData = { startX: 0, startY: 0, initialLeft: 0, initialTop: 0, currentWindow: null };

    static isResizing = false;
    static resizeData = { startX: 0, startY: 0, initialWidth: 0, initialHeight: 0, initialLeft: 0, initialTop: 0, direction: '', currentWindow: null };

    static windowInstances = {};
    static instanceCounter = 0;

    static MIN_WIDTH = 400;
    static MIN_HEIGHT = 300;

    static init() {
        document.addEventListener('mouseup', this.stopDrag.bind(this));
        document.addEventListener('mousemove', this.dragElement.bind(this));
        document.addEventListener('mouseup', this.stopResize.bind(this));
        document.addEventListener('mousemove', this.resizeWindow.bind(this));
    }


    static createWindow(appType, options = {}) {
        this.instanceCounter++;
        const windowId = `${appType}-${this.instanceCounter}`;

        const {
            title = appType.charAt(0).toUpperCase() + appType.slice(1),
            width = 800,
            height = 500,
            left = 50 + (this.instanceCounter % 10) * 30,
            top = 50 + (this.instanceCounter % 10) * 30,
            content = '',
            icon = ''
        } = options;


        const win = document.createElement('div');
        win.id = windowId;
        win.className = 'window glass';
        win.style.cssText = `
            position: absolute;
            top: ${top}px;
            left: ${left}px;
            width: ${Math.max(width, this.MIN_WIDTH)}px;
            height: ${Math.max(height, this.MIN_HEIGHT)}px;
            display: flex;
            flex-direction: column;
            min-width: ${this.MIN_WIDTH}px;
            min-height: ${this.MIN_HEIGHT}px;
        `;

        win.innerHTML = `
            <div class="window-header">
                <div class="title-drag-area">
                    ${icon ? `<span class="icon" style="margin-right:8px;">${icon}</span>` : ''}
                    <span class="window-title">${title}</span>
                </div>
                <div class="window-controls">
                    <div class="win-btn" data-action="minimize"><i class="ph ph-minus"></i></div>
                    <div class="win-btn" data-action="maximize"><i class="ph ph-square"></i></div>
                    <div class="win-btn close" data-action="close"><i class="ph ph-x"></i></div>
                </div>
            </div>
            <div class="window-body" style="flex:1; overflow:hidden; display:flex; flex-direction:column;">
                ${content}
            </div>
            </div>
            <div class="resize-handle resize-n" data-resize="n" style="position:absolute; top:0; left:5px; right:5px; height:5px; cursor:ns-resize;"></div>
            <div class="resize-handle resize-s" data-resize="s" style="position:absolute; bottom:0; left:5px; right:5px; height:5px; cursor:ns-resize;"></div>
            <div class="resize-handle resize-e" data-resize="e" style="position:absolute; top:5px; right:0; bottom:5px; width:5px; cursor:ew-resize;"></div>
            <div class="resize-handle resize-w" data-resize="w" style="position:absolute; top:5px; left:0; bottom:5px; width:5px; cursor:ew-resize;"></div>
            <div class="resize-handle resize-nw" data-resize="nw" style="position:absolute; top:0; left:0; width:10px; height:10px; cursor:nwse-resize;"></div>
            <div class="resize-handle resize-ne" data-resize="ne" style="position:absolute; top:0; right:0; width:10px; height:10px; cursor:nesw-resize;"></div>
            <div class="resize-handle resize-sw" data-resize="sw" style="position:absolute; bottom:0; left:0; width:10px; height:10px; cursor:nesw-resize;"></div>
            <div class="resize-handle resize-se" data-resize="se" style="position:absolute; bottom:0; right:0; width:10px; height:10px; cursor:nwse-resize;"></div>
        `;


        document.body.appendChild(win);


        if (!this.windowInstances[appType]) {
            this.windowInstances[appType] = [];
        }
        this.windowInstances[appType].push({
            id: windowId,
            element: win,
            title: title,
            minimized: false
        });


        this.attachWindowListeners(windowId, appType);


        this.bringToFront(win);


        this.updateTaskbarIcon(appType);

        console.log(`[WindowManager] Created window: ${windowId}`);
        return windowId;
    }


    static attachWindowListeners(windowId, appType) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const header = win.querySelector('.window-header');
        const titleDrag = win.querySelector('.title-drag-area');


        win.querySelectorAll('.win-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'minimize') this.minimizeWindow(windowId);
                else if (action === 'maximize') this.maximizeWindow(windowId);
                else if (action === 'close') this.closeWindow(windowId, appType);
            });
        });


        header.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.maximizeWindow(windowId);
        });


        titleDrag.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.startDrag(e, windowId);
        });


        win.addEventListener('mousedown', () => this.bringToFront(win));


        win.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startResize(e, windowId, handle.dataset.resize);
            });
        });
    }


    static getInstances(appType) {
        return this.windowInstances[appType] || [];
    }


    static updateTaskbarIcon(appType) {
        const icon = document.getElementById('icon-' + appType);
        if (!icon) return;

        const instances = this.getInstances(appType);
        if (instances.length > 0) {
            icon.classList.add('open');
            icon.classList.add('open');
            let badge = icon.querySelector('.instance-badge');
            if (instances.length > 1) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'instance-badge';
                    icon.appendChild(badge);
                }
                badge.textContent = instances.length;
            } else if (badge) {
                badge.remove();
            }
        } else {
            icon.classList.remove('open');
            const badge = icon.querySelector('.instance-badge');
            if (badge) badge.remove();
        }
    }


    static toggleWindow(id) {
        const el = document.getElementById(id);
        const icon = document.getElementById('icon-' + id);
        if (!el) {
            console.warn(`Window "${id}" not found`);
            return;
        }

        const computedDisplay = window.getComputedStyle(el).display;
        const isVisible = computedDisplay !== 'none';

        if (isVisible) {
            if (parseInt(el.style.zIndex) < this.zIndexCounter) {
                this.bringToFront(el);
            } else {
                this.minimizeWindow(id);
            }
        } else {
            el.style.display = 'flex';
            this.bringToFront(el);
            if (icon) icon.classList.add('open');
        }
    }

    static openWindow(id) {
        const el = document.getElementById(id);
        const icon = document.getElementById('icon-' + id);
        if (!el) {
            console.warn(`Window ${id} not found`);
            return;
        }
        el.style.display = 'flex';
        this.bringToFront(el);
        if (icon) icon.classList.add('open');
    }

    static closeWindow(id, appType = null) {
        const el = document.getElementById(id);
        if (!el) return;


        if (appType && this.windowInstances[appType]) {
            this.windowInstances[appType] = this.windowInstances[appType].filter(w => w.id !== id);
            el.remove();
            this.updateTaskbarIcon(appType);
        } else {

            const icon = document.getElementById('icon-' + id);
            el.style.display = 'none';
            el.classList.remove('maximized');
            el.style.width = "";
            el.style.height = "";
            el.style.borderRadius = "8px";
            if (icon) icon.classList.remove('open');
        }
    }

    static maximizeWindow(id) {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.classList.contains('maximized')) {

            el.classList.remove('maximized');
            el.style.width = el.dataset.prevWidth || "";
            el.style.height = el.dataset.prevHeight || "";
            el.style.top = el.dataset.prevTop || "100px";
            el.style.left = el.dataset.prevLeft || "100px";
            el.style.borderRadius = "8px";
        } else {

            el.dataset.prevWidth = el.style.width || el.offsetWidth + 'px';
            el.dataset.prevHeight = el.style.height || el.offsetHeight + 'px';
            el.dataset.prevTop = el.style.top;
            el.dataset.prevLeft = el.style.left;


            el.classList.add('maximized');
            el.style.width = "100%";
            el.style.height = "calc(100vh - 42px)";
            el.style.top = "0";
            el.style.left = "0";
            el.style.borderRadius = "0";
        }
        this.bringToFront(el);
    }

    static minimizeWindow(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'none';


        for (const appType in this.windowInstances) {
            const instance = this.windowInstances[appType].find(w => w.id === id);
            if (instance) {
                instance.minimized = true;
                break;
            }
        }
    }

    static restoreWindow(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = 'flex';
        this.bringToFront(el);


        for (const appType in this.windowInstances) {
            const instance = this.windowInstances[appType].find(w => w.id === id);
            if (instance) {
                instance.minimized = false;
                break;
            }
        }
    }

    static bringToFront(el) {
        if (!el) return;
        this.zIndexCounter++;
        el.style.zIndex = this.zIndexCounter;
    }

    static focusWindow(windowId) {
        const el = document.getElementById(windowId);
        if (!el) return;


        if (window.getComputedStyle(el).display === 'none') {
            this.restoreWindow(windowId);
        } else {
            this.bringToFront(el);
        }
    }


    static startDrag(e, windowId) {
        if (e.button !== 0) return;
        const win = document.getElementById(windowId);

        if (!win) return;

        this.bringToFront(win);
        if (win.classList.contains('maximized')) return;

        this.isDragging = true;
        this.dragData.startX = e.clientX;
        this.dragData.startY = e.clientY;
        this.dragData.currentWindow = win;

        const style = window.getComputedStyle(win);
        this.dragData.initialLeft = parseInt(style.left) || 0;
        this.dragData.initialTop = parseInt(style.top) || 0;

        e.preventDefault();
    }

    static dragElement(e) {
        if (!this.isDragging || !this.dragData.currentWindow) return;
        e.preventDefault();
        const dx = e.clientX - this.dragData.startX;
        const dy = e.clientY - this.dragData.startY;
        this.dragData.currentWindow.style.left = (this.dragData.initialLeft + dx) + "px";
        this.dragData.currentWindow.style.top = (this.dragData.initialTop + dy) + "px";
    }

    static stopDrag() {
        this.isDragging = false;
        this.dragData.currentWindow = null;
    }

    static setWindowTitle(windowId, title) {
        const el = document.getElementById(windowId);
        if (!el) return;
        const titleEl = el.querySelector('.window-title');
        if (titleEl) titleEl.textContent = title;


        for (const appType in this.windowInstances) {
            const instance = this.windowInstances[appType].find(w => w.id === windowId);
            if (instance) {
                instance.title = title;
                break;
            }
        }
    }


    static startResize(e, windowId, direction) {
        const win = document.getElementById(windowId);
        if (!win || win.classList.contains('maximized')) return;

        this.isResizing = true;
        this.resizeData = {
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: win.offsetWidth,
            initialHeight: win.offsetHeight,
            initialLeft: parseInt(win.style.left) || win.offsetLeft,
            initialTop: parseInt(win.style.top) || win.offsetTop,
            direction: direction,
            currentWindow: win
        };

        this.bringToFront(win);
    }

    static resizeWindow(e) {
        if (!this.isResizing || !this.resizeData.currentWindow) return;
        e.preventDefault();

        const win = this.resizeData.currentWindow;
        const dx = e.clientX - this.resizeData.startX;
        const dy = e.clientY - this.resizeData.startY;
        const dir = this.resizeData.direction;

        let newWidth = this.resizeData.initialWidth;
        let newHeight = this.resizeData.initialHeight;
        let newLeft = this.resizeData.initialLeft;
        let newTop = this.resizeData.initialTop;


        if (dir.includes('e')) {
            newWidth = Math.max(this.MIN_WIDTH, this.resizeData.initialWidth + dx);
        }

        if (dir.includes('w')) {
            const proposedWidth = this.resizeData.initialWidth - dx;
            if (proposedWidth >= this.MIN_WIDTH) {
                newWidth = proposedWidth;
                newLeft = this.resizeData.initialLeft + dx;
            }
        }

        if (dir.includes('s')) {
            newHeight = Math.max(this.MIN_HEIGHT, this.resizeData.initialHeight + dy);
        }

        if (dir.includes('n')) {
            const proposedHeight = this.resizeData.initialHeight - dy;
            if (proposedHeight >= this.MIN_HEIGHT) {
                newHeight = proposedHeight;
                newTop = this.resizeData.initialTop + dy;
            }
        }

        win.style.width = newWidth + 'px';
        win.style.height = newHeight + 'px';
        win.style.left = newLeft + 'px';
        win.style.top = newTop + 'px';
    }

    static stopResize() {
        this.isResizing = false;
        this.resizeData.currentWindow = null;
    }
}
