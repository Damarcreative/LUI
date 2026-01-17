import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

export class TaskManager {
    static instances = new Map();
    static updateIntervals = new Map();

    static createNewInstance(options = {}) {
        const icon = '<i class="ph ph-chart-bar" style="font-size:16px; color:#4caf50;"></i>';

        const windowContent = this.getWindowContent();

        const windowId = WindowManager.createWindow('taskmanager', {
            title: 'Task Manager',
            width: 950,
            height: 650,
            content: windowContent,
            icon: icon
        });

        this.instances.set(windowId, {
            currentTab: 'processes',
            currentPerfTab: 'cpu',
            cpuHistory: [],
            memHistory: [],
            diskHistory: [],
            networkHistory: [],
            selectedPid: null,
            sortColumn: 'cpu',
            sortAsc: false,
            processes: [],
            socket: null
        });

        this.initInstance(windowId);

        console.log(`[TaskManager] Created new instance: ${windowId}`);
        return windowId;
    }

    static getWindowContent() {
        return `
            <div class="tm-container">
                <div class="tm-sidebar">
                    <div class="tm-nav-item active" data-tab="processes" title="Processes">
                        <span class="tm-nav-icon"><i class="ph ph-squares-four"></i></span>
                        <span class="tm-nav-text">Processes</span>
                    </div>
                    <div class="tm-nav-item" data-tab="performance" title="Performance">
                        <span class="tm-nav-icon"><i class="ph ph-chart-line-up"></i></span>
                        <span class="tm-nav-text">Performance</span>
                    </div>
                    <div class="tm-nav-item" data-tab="details" title="Details">
                        <span class="tm-nav-icon"><i class="ph ph-list-dashes"></i></span>
                        <span class="tm-nav-text">Details</span>
                    </div>
                </div>
                <div class="tm-main">
                    <div class="tm-view" data-view="processes">
                        <div class="tm-table-header tm-process-header">
                            <div class="tm-col-name sortable" data-sort="name">Name <span class="sort-icon"></span></div>
                            <div class="tm-col-cpu sortable" data-sort="cpu">CPU <span class="sort-icon">▼</span></div>
                            <div class="tm-col-mem sortable" data-sort="memory">Memory <span class="sort-icon"></span></div>
                            <div class="tm-col-disk">Disk</div>
                            <div class="tm-col-net">Network</div>
                            <div class="tm-col-pid sortable" data-sort="pid">PID <span class="sort-icon"></span></div>
                        </div>
                        <div class="tm-table-body tm-process-list"></div>
                        <div class="tm-footer">
                            <div class="tm-status">Loading...</div>
                            <button class="tm-end-btn" disabled>End task</button>
                        </div>
                    </div>

                    <div class="tm-view" data-view="performance" style="display:none;">
                        <div class="perf-layout">
                            <div class="perf-sidebar">
                                <div class="perf-item active" data-perf="cpu">
                                    <div class="perf-title">CPU</div>
                                    <div class="perf-val perf-cpu-val">0%</div>
                                    <div class="perf-small-graph perf-cpu-mini"></div>
                                </div>
                                <div class="perf-item" data-perf="memory">
                                    <div class="perf-title">Memory</div>
                                    <div class="perf-val perf-mem-val">0 / 0 GB</div>
                                    <div class="perf-small-graph perf-mem-mini"></div>
                                </div>
                                <div class="perf-item" data-perf="disk">
                                    <div class="perf-title">Disk</div>
                                    <div class="perf-val perf-disk-val">0%</div>
                                    <div class="perf-small-graph perf-disk-mini"></div>
                                </div>
                                <div class="perf-item" data-perf="network">
                                    <div class="perf-title">Network</div>
                                    <div class="perf-val perf-net-val">0 KB/s</div>
                                    <div class="perf-small-graph perf-net-mini"></div>
                                </div>
                            </div>
                            <div class="perf-content">
                                <div class="perf-detail" data-detail="cpu">
                                    <div class="perf-header-big">
                                        <div class="perf-header-title">CPU</div>
                                        <div class="perf-header-sub cpu-name">--</div>
                                    </div>
                                    <div class="perf-graph-container">
                                        <div class="perf-graph-label">% Utilization over 60 seconds</div>
                                        <div class="perf-big-graph perf-cpu-graph"></div>
                                    </div>
                                    <div class="perf-stats-grid cpu-stats">
                                        <div><span>Utilization</span><h3 class="cpu-util">0%</h3></div>
                                        <div><span>Speed</span><h3 class="cpu-speed">0 GHz</h3></div>
                                        <div><span>Processes</span><h3 class="cpu-procs">0</h3></div>
                                        <div><span>Threads</span><h3 class="cpu-threads">--</h3></div>
                                        <div><span>Cores</span><h3 class="cpu-cores">0</h3></div>
                                        <div><span>Up time</span><h3 class="cpu-uptime">0:00:00</h3></div>
                                    </div>
                                </div>

                                <div class="perf-detail" data-detail="memory" style="display:none;">
                                    <div class="perf-header-big">
                                        <div class="perf-header-title">Memory</div>
                                        <div class="perf-header-sub mem-total">0 GB</div>
                                    </div>
                                    <div class="perf-graph-container">
                                        <div class="perf-graph-label">Memory usage over 60 seconds</div>
                                        <div class="perf-big-graph perf-mem-graph"></div>
                                    </div>
                                    <div class="perf-stats-grid mem-stats">
                                        <div><span>In use</span><h3 class="mem-used">0 GB</h3></div>
                                        <div><span>Available</span><h3 class="mem-avail">0 GB</h3></div>
                                        <div><span>Cached</span><h3 class="mem-cached">0 GB</h3></div>
                                        <div><span>Committed</span><h3 class="mem-commit">0 GB</h3></div>
                                        <div><span>Paged pool</span><h3 class="mem-paged">0 MB</h3></div>
                                        <div><span>Swap Used</span><h3 class="mem-swap">0 GB</h3></div>
                                    </div>
                                </div>

                                <div class="perf-detail" data-detail="disk" style="display:none;">
                                    <div class="perf-header-big">
                                        <div class="perf-header-title">Disk</div>
                                        <div class="perf-header-sub disk-name">--</div>
                                    </div>
                                    <div class="perf-graph-container">
                                        <div class="perf-graph-label">Active time</div>
                                        <div class="perf-big-graph perf-disk-graph"></div>
                                    </div>
                                    <div class="perf-stats-grid disk-stats">
                                        <div><span>Read speed</span><h3 class="disk-read">0 MB/s</h3></div>
                                        <div><span>Write speed</span><h3 class="disk-write">0 MB/s</h3></div>
                                        <div><span>Capacity</span><h3 class="disk-capacity">0 GB</h3></div>
                                    </div>
                                </div>

                                <div class="perf-detail" data-detail="network" style="display:none;">
                                    <div class="perf-header-big">
                                        <div class="perf-header-title">Network</div>
                                        <div class="perf-header-sub net-name">--</div>
                                    </div>
                                    <div class="perf-graph-container">
                                        <div class="perf-graph-label">Throughput</div>
                                        <div class="perf-big-graph perf-net-graph"></div>
                                    </div>
                                    <div class="perf-stats-grid net-stats">
                                        <div><span>Send</span><h3 class="net-send">0 KB/s</h3></div>
                                        <div><span>Receive</span><h3 class="net-recv">0 KB/s</h3></div>
                                        <div><span>IP Address</span><h3 class="net-ip">--</h3></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tm-view" data-view="details" style="display:none;">
                        <div class="tm-table-header tm-details-header">
                            <div class="tm-col-name">Name</div>
                            <div class="tm-col-pid">PID</div>
                            <div class="tm-col-status">Status</div>
                            <div class="tm-col-user">User name</div>
                            <div class="tm-col-cpu">CPU</div>
                            <div class="tm-col-mem">Memory</div>
                            <div class="tm-col-cmd">Command line</div>
                        </div>
                        <div class="tm-table-body tm-details-list"></div>
                        <div class="tm-footer">
                            <div class="tm-status tm-details-status">Loading...</div>
                            <button class="tm-end-btn tm-details-end" disabled>End task</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    static async initInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);

        win.querySelectorAll('.tm-nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', () => {
                win.querySelectorAll('.tm-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.currentTab = item.dataset.tab;
                this.switchTab(windowId, item.dataset.tab);
            });
        });

        win.querySelectorAll('.perf-item[data-perf]').forEach(item => {
            item.addEventListener('click', () => {
                win.querySelectorAll('.perf-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.currentPerfTab = item.dataset.perf;
                this.switchPerfTab(windowId, item.dataset.perf);
            });
        });

        win.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                if (state.sortColumn === column) {
                    state.sortAsc = !state.sortAsc;
                } else {
                    state.sortColumn = column;
                    state.sortAsc = false;
                }
                this.updateSortIcons(windowId);
                this.renderProcessList(windowId, state.processes);
            });
        });

        const endBtn = win.querySelector('.tm-end-btn');
        endBtn.onclick = () => this.endTask(windowId);

        const detailsEndBtn = win.querySelector('.tm-details-end');
        if (detailsEndBtn) {
            detailsEndBtn.onclick = () => this.endTask(windowId);
        }

        console.log('[TaskManager] Connecting to WebSocket...');

        try {
            const { AuthService } = await import('../../system/lib/AuthService.js');
            const token = AuthService.getToken();

            const socket = io('http://localhost:8080/system', {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                auth: {
                    token: token
                },
                extraHeaders: {
                    'x-session-token': token
                }
            });

            state.socket = socket;

            socket.on('connect', () => {
                console.log(`[TaskManager] Connected to server (ID: ${socket.id})`);
                const statusEl = win.querySelector('.tm-status');
                if (statusEl) statusEl.textContent = 'Connected | Monitoring...';

                socket.emit('start-monitoring');
                socket.emit('ping');
            });


            socket.on('pong', (data) => {
                console.log('[TaskManager] Pong received:', data);
                const statusEl = win.querySelector('.tm-status');
                if (statusEl) statusEl.textContent = `Connected | Server Alive (${new Date(data.time).toLocaleTimeString()})`;
            });

            socket.on('connect_error', (err) => {
                console.error('[TaskManager] Connection Error:', err.message);
                const statusEl = win.querySelector('.tm-status');
                if (statusEl) statusEl.textContent = `Connection Error: ${err.message}. Retrying...`;
            });

            socket.on('disconnect', (reason) => {
                console.warn('[TaskManager] Disconnected:', reason);
                const statusEl = win.querySelector('.tm-status');
                if (statusEl) statusEl.textContent = 'Disconnected';
            });

            socket.on('stats', (data) => {
                const { cpu, memory, processes, uptime } = data;

                state.cpuHistory.push(cpu.load.current);
                if (state.cpuHistory.length > 60) state.cpuHistory.shift();

                state.memHistory.push(memory.usedPercent);
                if (state.memHistory.length > 60) state.memHistory.shift();

                state.processes = processes.list;

                this.renderProcessList(windowId, processes.list);

                const statusEl = win.querySelector('.tm-status');
                if (statusEl) {
                    statusEl.textContent = `Processes: ${processes.all} | CPU: ${cpu.load.current.toFixed(0)}% | Memory: ${memory.usedPercent.toFixed(0)}%`;
                }

                this.updatePerformanceView(windowId, { cpu, memory, uptime });
            });

            socket.on('disk', (data) => {
                this.updateDiskInfo(windowId, data);
            });

            socket.on('network', (data) => {
                this.updateNetworkInfo(windowId, data);
            });

            socket.on('process-killed', async ({ pid, success }) => {
                const { DialogService } = await import('../../system/lib/DialogService.js');
                if (success) {
                    await DialogService.alert(`Process ${pid} terminated.`, { title: 'Success', type: 'success' });
                    state.selectedPid = null;
                    win.querySelector('.tm-end-btn').disabled = true;
                    if (win.querySelector('.tm-details-end')) win.querySelector('.tm-details-end').disabled = true;
                }
            });

            socket.on('process-error', async ({ message }) => {
                const { DialogService } = await import('../../system/lib/DialogService.js');
                await DialogService.alert(`Error: ${message}`, { title: 'Error', type: 'error' });
            });

            socket.on('disconnect', () => {
                console.log('[TaskManager] Disconnected');
                const statusEl = win.querySelector('.tm-status');
                if (statusEl) statusEl.textContent = 'Disconnected';
            });

            const observer = new MutationObserver((mutations) => {
                if (!document.getElementById(windowId)) {
                    if (state.socket) {
                        state.socket.emit('stop-monitoring');
                        state.socket.disconnect();
                    }
                    this.instances.delete(windowId);
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        } catch (error) {
            console.error('[TaskManager] Initialization error:', error);
        }
    }

    static switchTab(windowId, tab) {
        const win = document.getElementById(windowId);
        if (!win) return;

        win.querySelectorAll('.tm-view').forEach(v => v.style.display = 'none');
        const view = win.querySelector(`.tm-view[data-view="${tab}"]`);
        if (view) view.style.display = 'flex';
    }

    static switchPerfTab(windowId, tab) {
        const win = document.getElementById(windowId);
        if (!win) return;

        win.querySelectorAll('.perf-detail').forEach(d => d.style.display = 'none');
        const detail = win.querySelector(`.perf-detail[data-detail="${tab}"]`);
        if (detail) detail.style.display = 'block';
    }

    static updateSortIcons(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);

        win.querySelectorAll('.sortable').forEach(header => {
            const icon = header.querySelector('.sort-icon');
            if (header.dataset.sort === state.sortColumn) {
                icon.textContent = state.sortAsc ? '▲' : '▼';
            } else {
                icon.textContent = '';
            }
        });
    }


    static renderProcessList(windowId, processes) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const list = win.querySelector('.tm-process-list');
        const detailsList = win.querySelector('.tm-details-list');

        const sorted = [...processes].sort((a, b) => {
            let valA = a[state.sortColumn];
            let valB = b[state.sortColumn];
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (state.sortAsc) {
                return valA > valB ? 1 : -1;
            }
            return valA < valB ? 1 : -1;
        });

        if (list) {
            list.innerHTML = sorted.map(p => `
                <div class="tm-row ${state.selectedPid === p.pid ? 'selected' : ''}" data-pid="${p.pid}" tabindex="0">
                    <div class="tm-col-name"><i class="ph ph-app-window tm-proc-icon"></i>${this.truncate(p.name, 25)}</div>
                    <div class="tm-col-cpu ${p.cpu > 10 ? 'high-usage' : ''}">${p.cpu.toFixed(1)}%</div>
                    <div class="tm-col-mem">${this.formatMemory(p.memRss)}</div>
                    <div class="tm-col-disk">0 MB/s</div>
                    <div class="tm-col-net">0 Mbps</div>
                    <div class="tm-col-pid">${p.pid}</div>
                </div>
            `).join('');

            list.querySelectorAll('.tm-row').forEach(row => {
                row.onclick = () => {
                    list.querySelectorAll('.tm-row').forEach(r => r.classList.remove('selected'));
                    row.classList.add('selected');
                    state.selectedPid = parseInt(row.dataset.pid);
                    win.querySelector('.tm-end-btn').disabled = false;
                };
            });
        }

        if (detailsList) {
            detailsList.innerHTML = sorted.map(p => `
                <div class="tm-row ${state.selectedPid === p.pid ? 'selected' : ''}" data-pid="${p.pid}" tabindex="0">
                    <div class="tm-col-name">${p.name}</div>
                    <div class="tm-col-pid">${p.pid}</div>
                    <div class="tm-col-status">${p.state}</div>
                    <div class="tm-col-user">${p.user || 'SYSTEM'}</div>
                    <div class="tm-col-cpu">${p.cpu.toFixed(1)}%</div>
                    <div class="tm-col-mem">${this.formatMemory(p.memRss)}</div>
                    <div class="tm-col-cmd" title="${p.command || ''}">${this.truncate(p.command || '', 40)}</div>
                </div>
            `).join('');

            detailsList.querySelectorAll('.tm-row').forEach(row => {
                row.onclick = () => {
                    detailsList.querySelectorAll('.tm-row').forEach(r => r.classList.remove('selected'));
                    row.classList.add('selected');
                    state.selectedPid = parseInt(row.dataset.pid);
                    win.querySelector('.tm-details-end').disabled = false;
                };
            });
        }
    }

    static updatePerformanceView(windowId, data) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const { cpu, memory, uptime } = data;

        win.querySelector('.perf-cpu-val').textContent = `${cpu.load.current.toFixed(0)}%`;
        this.renderMiniGraph(win.querySelector('.perf-cpu-mini'), state.cpuHistory, '#0078d4');

        const memUsedGB = (memory.used / 1073741824).toFixed(1);
        const memTotalGB = (memory.total / 1073741824).toFixed(1);
        win.querySelector('.perf-mem-val').textContent = `${memUsedGB}/${memTotalGB} GB`;
        this.renderMiniGraph(win.querySelector('.perf-mem-mini'), state.memHistory, '#8e44ad');

        win.querySelector('.cpu-name').textContent = `${cpu.manufacturer} ${cpu.brand}`;
        win.querySelector('.cpu-util').textContent = `${cpu.load.current.toFixed(0)}%`;
        win.querySelector('.cpu-speed').textContent = `${cpu.speed.toFixed(2)} GHz`;
        win.querySelector('.cpu-cores').textContent = `${cpu.physicalCores} (${cpu.cores} logical)`;
        win.querySelector('.cpu-uptime').textContent = uptime.formatted;
        this.renderBigGraph(win.querySelector('.perf-cpu-graph'), state.cpuHistory, '#0078d4');

        win.querySelector('.mem-total').textContent = `${memTotalGB} GB DDR4`;
        win.querySelector('.mem-used').textContent = `${memUsedGB} GB`;
        win.querySelector('.mem-avail').textContent = `${(memory.available / 1073741824).toFixed(1)} GB`;
        win.querySelector('.mem-cached').textContent = `${(memory.cached / 1073741824).toFixed(1)} GB`;
        win.querySelector('.mem-commit').textContent = `${memUsedGB}/${memTotalGB} GB`;
        win.querySelector('.mem-swap').textContent = `${(memory.swapUsed / 1073741824).toFixed(1)} GB`;
        this.renderBigGraph(win.querySelector('.perf-mem-graph'), state.memHistory, '#8e44ad');
    }

    static updateDiskInfo(windowId, data) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const { disks, partitions, io } = data;

        const main = partitions[0];
        const usePercent = main ? main.usePercent : 0;

        state.diskHistory.push(usePercent);
        if (state.diskHistory.length > 60) state.diskHistory.shift();

        win.querySelector('.perf-disk-val').textContent = `${usePercent.toFixed(0)}%`;
        this.renderMiniGraph(win.querySelector('.perf-disk-mini'), state.diskHistory, '#27ae60');

        if (disks[0]) {
            win.querySelector('.disk-name').textContent = disks[0].name || disks[0].vendor || 'Disk';
        }
        win.querySelector('.disk-capacity').textContent = main ? `${(main.size / 1073741824).toFixed(0)} GB` : '0 GB';

        if (io) {
            win.querySelector('.disk-read').textContent = `${(io.readBytesPerSec / 1048576).toFixed(1)} MB/s`;
            win.querySelector('.disk-write').textContent = `${(io.writeBytesPerSec / 1048576).toFixed(1)} MB/s`;
        }

        this.renderBigGraph(win.querySelector('.perf-disk-graph'), state.diskHistory, '#27ae60');
    }

    static updateNetworkInfo(windowId, data) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        const { interfaces, stats, defaultInterface } = data;

        const defaultStats = stats.find(s => s.iface === defaultInterface) || stats[0];
        const defaultIface = interfaces.find(i => i.iface === defaultInterface) || interfaces[0];

        if (defaultStats) {
            const totalKBps = (defaultStats.rxSec + defaultStats.txSec) / 1024;
            state.networkHistory.push(Math.min(totalKBps, 1000));
            if (state.networkHistory.length > 60) state.networkHistory.shift();

            win.querySelector('.perf-net-val').textContent = `${totalKBps.toFixed(0)} KB/s`;
            this.renderMiniGraph(win.querySelector('.perf-net-mini'), state.networkHistory, '#e67e22', 1000);

            win.querySelector('.net-send').textContent = `${(defaultStats.txSec / 1024).toFixed(0)} KB/s`;
            win.querySelector('.net-recv').textContent = `${(defaultStats.rxSec / 1024).toFixed(0)} KB/s`;
            this.renderBigGraph(win.querySelector('.perf-net-graph'), state.networkHistory, '#e67e22', 1000);
        }

        if (defaultIface) {
            win.querySelector('.net-name').textContent = defaultIface.ifaceName || defaultIface.iface;
            win.querySelector('.net-ip').textContent = defaultIface.ip4 || '--';
        }
    }

    static renderMiniGraph(container, data, color, maxVal = 100) {
        if (!container) return;
        const displayData = data.slice(-30);
        container.innerHTML = displayData.map(v =>
            `<div class="graph-bar" style="height:${Math.min((v / maxVal) * 100, 100)}%; background:${color};"></div>`
        ).join('');
    }

    static renderBigGraph(container, data, color, maxVal = 100) {
        if (!container) return;
        const width = container.offsetWidth || 400;
        const height = container.offsetHeight || 120;
        const displayData = data.slice(-60);

        const points = displayData.map((v, i) => {
            const x = (i / 59) * width;
            const y = height - (Math.min(v / maxVal, 1) * height);
            return `${x},${y}`;
        }).join(' ');

        const fillPoints = `0,${height} ${points} ${width},${height}`;

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grad-${color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
                    </linearGradient>
                </defs>
                <polygon points="${fillPoints}" fill="url(#grad-${color.replace('#', '')})" />
                <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" />
            </svg>
        `;
    }

    static async endTask(windowId) {
        const state = this.instances.get(windowId);
        if (!state.selectedPid) return;

        const { DialogService } = await import('../../system/lib/DialogService.js');
        const confirmed = await DialogService.danger(
            `Do you want to end process ${state.selectedPid}?`,
            { title: 'End Task', confirmText: 'End process' }
        );

        if (confirmed && state.socket) {
            state.socket.emit('kill-process', { pid: state.selectedPid });
        }
    }

    static formatMemory(bytes) {
        if (!bytes) return '0 MB';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
        if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
        return `${(bytes / 1073741824).toFixed(2)} GB`;
    }

    static truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }
}
