import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';


const XTERM_CSS = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css';
const XTERM_JS = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js';
const XTERM_FIT_JS = 'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js';


function loadStyle(url) {
    if (document.querySelector(`link[href="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}


async function loadScript(url, globalName) {
    if (window[globalName]) return window[globalName];
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve(window[globalName]);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export class Terminal {

    static instances = new Map();


    static async createNewInstance(options = {}) {

        loadStyle(XTERM_CSS);
        await Promise.all([
            loadScript(XTERM_JS, 'Terminal'),
            loadScript(XTERM_FIT_JS, 'FitAddon')
        ]);

        const icon = '<i class="ph ph-terminal" style="font-size:16px; color:#444;"></i>';
        const windowContent = this.getWindowContent();

        const windowId = WindowManager.createWindow('cli', {
            title: 'Terminal',
            width: 800,
            height: 500,
            content: windowContent,
            icon: icon
        });


        this.instances.set(windowId, {
            socket: null,
            terminals: new Map(),
            activeTabId: null,
            tabCount: 0
        });


        await this.initInstance(windowId);

        console.log(`[Terminal] Created new instance: ${windowId}`);
        return windowId;
    }

    static getWindowContent() {
        return `
            <div class="cli-container">
                <div class="cli-tabs-bar">
                    <div class="cli-add-tab" title="New Tab"><i class="ph ph-plus"></i></div>
                </div>
                <!-- Connection Status -->
                <div class="cli-status-bar" style="display:none; background:#ef4444; color:white; font-size:11px; padding:2px 10px;">Disconnected</div>
                <div class="cli-tabs-content"></div>
            </div>
        `;
    }

    static async initInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;
        const state = this.instances.get(windowId);


        win.querySelector('.cli-add-tab').onclick = (e) => {
            e.stopPropagation();
            this.createSession(windowId);
        };


        try {
            const { AuthService } = await import('../../system/lib/AuthService.js');
            const token = AuthService.getToken();


            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = 'localhost:8080';
            const url = `${protocol}//${host}/terminal`;

            console.log(`[Terminal] Connecting to ${url}...`);

            const socket = io(url, {
                transports: ['websocket'],
                auth: { token },
                extraHeaders: { 'x-session-token': token }
            });

            state.socket = socket;

            socket.on('connect', () => {
                console.log('[Terminal] Connected');
                win.querySelector('.cli-status-bar').style.display = 'none';

                socket.emit('list-sessions');
            });

            socket.on('disconnect', () => {
                console.log('[Terminal] Disconnected');
                win.querySelector('.cli-status-bar').style.display = 'block';
            });

            socket.on('error', (err) => {
                console.error('[Terminal] Socket Error:', err);
            });


            socket.on('sessions-list', (sessions) => {
                console.log('[Terminal] Restoring sessions:', sessions);



                if (sessions.length > 0) {

                    sessions.forEach(s => {
                        this.createTabForSession(windowId, s.id);
                    });
                } else {

                    this.createSession(windowId);
                }
            });


            socket.on('output', (data) => {
                const activeTab = state.terminals.get(state.activeTabId);
                if (activeTab) {
                    activeTab.term.write(data);
                }
            });


            socket.on('session-created', (session) => {
                this.createTabForSession(windowId, session.id);
            });


            socket.on('session-exit', ({ sessionId }) => {

                for (const [tabId, termData] of state.terminals.entries()) {
                    if (termData.sessionId === sessionId) {
                        this.closeTab(windowId, tabId, false);
                        break;
                    }
                }
            });

        } catch (err) {
            console.error('[Terminal] Init failed:', err);
        }


        const observer = new MutationObserver((mutations) => {
            if (!document.getElementById(windowId)) {
                if (state.socket) state.socket.disconnect();


                state.terminals.forEach(t => t.term.dispose());

                this.instances.delete(windowId);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }


    static createSession(windowId) {
        const state = this.instances.get(windowId);
        if (state && state.socket) {

            state.socket.emit('create-session', { cols: 80, rows: 24 });
        }
    }


    static async createTabForSession(windowId, sessionId) {
        const win = document.getElementById(windowId);
        const state = this.instances.get(windowId);
        if (!win || !state) return;


        for (const [tid, tdata] of state.terminals.entries()) {
            if (tdata.sessionId === sessionId) {
                this.switchTab(windowId, tid);
                return;
            }
        }

        state.tabCount++;
        const tabId = `tab-${state.tabCount}`;


        const tabsBar = win.querySelector('.cli-tabs-bar');
        const addBtn = win.querySelector('.cli-add-tab');

        const tab = document.createElement('div');
        tab.className = 'cli-tab';
        tab.id = `handle-${tabId}`;
        tab.innerHTML = `<span>Terminal ${state.tabCount}</span><span class="cli-tab-close"><i class="ph ph-x"></i></span>`;
        tab.onclick = () => this.switchTab(windowId, tabId);


        tab.querySelector('.cli-tab-close').onclick = (e) => {
            e.stopPropagation();
            this.closeTab(windowId, tabId, true);
        };

        tabsBar.insertBefore(tab, addBtn);


        const tabsContent = win.querySelector('.cli-tabs-content');
        const content = document.createElement('div');
        content.className = 'cli-tab-content';
        content.id = `content-${tabId}`;
        tabsContent.appendChild(content);


        const term = new window.Terminal({
            cursorBlink: true,
            theme: {
                background: '#0f172a',
                foreground: '#e2e8f0',
                selectionBackground: 'rgba(56, 189, 248, 0.3)',
                black: '#1e293b',
                red: '#ef4444',
                green: '#22c55e',
                yellow: '#eab308',
                blue: '#3b82f6',
                magenta: '#a855f7',
                cyan: '#06b6d4',
                white: '#f8fafc',
                brightBlack: '#475569',
                brightRed: '#f87171',
                brightGreen: '#4ade80',
                brightYellow: '#facc15',
                brightBlue: '#60a5fa',
                brightMagenta: '#c084fc',
                brightCyan: '#22d3ee',
                brightWhite: '#ffffff'
            },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 14,
            allowTransparency: true
        });


        const fitAddon = new window.FitAddon.FitAddon();
        term.loadAddon(fitAddon);


        term.open(content);


        await new Promise(r => setTimeout(r, 0));
        fitAddon.fit();


        term.onData(data => {

            if (state.activeTabId === tabId && state.socket) {
                state.socket.emit('input', data);
            }
        });

        term.onResize(size => {
            if (state.activeTabId === tabId && state.socket) {
                state.socket.emit('resize', size);
            }
        });


        state.terminals.set(tabId, { term, fitAddon, sessionId });


        this.switchTab(windowId, tabId);


        const resizeObserver = new ResizeObserver(() => {
            if (content.classList.contains('active')) {
                try { fitAddon.fit(); } catch (e) { }
            }
        });
        resizeObserver.observe(content);
    }

    static switchTab(windowId, tabId) {
        const win = document.getElementById(windowId);
        const state = this.instances.get(windowId);
        if (!win || !state) return;


        win.querySelectorAll('.cli-tab').forEach(t => t.classList.remove('active'));
        win.querySelectorAll('.cli-tab-content').forEach(c => c.classList.remove('active'));

        const handle = win.querySelector(`#handle-${tabId}`);
        const content = win.querySelector(`#content-${tabId}`);

        if (handle) handle.classList.add('active');
        if (content) content.classList.add('active');

        state.activeTabId = tabId;


        const termData = state.terminals.get(tabId);
        if (termData && state.socket) {
            state.socket.emit('attach-session', { sessionId: termData.sessionId });


            setTimeout(() => {
                termData.fitAddon.fit();
                termData.term.focus();
            }, 50);
        }
    }

    static closeTab(windowId, tabId, notifyServer) {
        const win = document.getElementById(windowId);
        const state = this.instances.get(windowId);
        if (!win || !state) return;

        const termData = state.terminals.get(tabId);


        win.querySelector(`#handle-${tabId}`)?.remove();
        win.querySelector(`#content-${tabId}`)?.remove();


        if (notifyServer && termData && state.socket) {
            state.socket.emit('kill-session', { sessionId: termData.sessionId });
        }


        if (termData) {
            termData.term.dispose();
            state.terminals.delete(tabId);
        }


        if (state.activeTabId === tabId) {
            const keys = Array.from(state.terminals.keys());
            if (keys.length > 0) {
                this.switchTab(windowId, keys[keys.length - 1]);
            } else {




            }
        }
    }
}
