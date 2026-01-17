/**
 * TaskManager Socket Handler
 * 
 * Handles real-time system monitoring via WebSockets.
 */

export function setupSockets(io, { si, exec, os, validateToken, TOKEN_HEADER }) {
    const nsp = io.of('/system');

    // Authentication Middleware
    nsp.use((socket, next) => {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.[TOKEN_HEADER];

        const validation = validateToken(token);

        if (!validation.valid) {
            console.log(`[TaskManager] Connection rejected: ${validation.error}`);
            return next(new Error(validation.error));
        }

        // Attach session to socket
        socket.session = validation.session;
        next();
    });

    nsp.on('connection', (socket) => {
        console.log(`[TaskManager] Client connected: ${socket.id} (${socket.session?.userId})`);

        socket.on('ping', () => {
            console.log('[TaskManager] Ping received from', socket.id);
            socket.emit('pong', { message: 'Server is alive', time: Date.now() });
        });

        // Monitoring interval
        let monitoringInterval;

        const startMonitoring = () => {
            if (monitoringInterval) clearInterval(monitoringInterval);

            // Immediate first push
            pushStats();

            monitoringInterval = setInterval(pushStats, 2000);
        };

        const pushStats = async () => {
            try {
                const [cpuData, cpuLoad, memData, processData, timeData] = await Promise.all([
                    si.cpu(), si.currentLoad(), si.mem(), si.processes(), si.time()
                ]);

                const formatUptime = (s) => {
                    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
                    const m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
                    return (d > 0 ? `${d}d ` : '') + `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
                };

                const stats = {
                    cpu: {
                        manufacturer: cpuData.manufacturer, brand: cpuData.brand, speed: cpuData.speed,
                        speedMax: cpuData.speedMax, cores: cpuData.cores, physicalCores: cpuData.physicalCores,
                        load: {
                            current: Math.round(cpuLoad.currentLoad * 100) / 100,
                            user: Math.round(cpuLoad.currentLoadUser * 100) / 100,
                            system: Math.round(cpuLoad.currentLoadSystem * 100) / 100,
                            idle: Math.round(cpuLoad.currentLoadIdle * 100) / 100,
                            perCore: cpuLoad.cpus.map(c => Math.round(c.load * 100) / 100)
                        }
                    },
                    memory: {
                        total: memData.total, used: memData.used, free: memData.free, available: memData.available,
                        usedPercent: Math.round((memData.used / memData.total) * 10000) / 100,
                        cached: memData.cached, buffers: memData.buffers,
                        swapTotal: memData.swaptotal, swapUsed: memData.swapused, swapFree: memData.swapfree
                    },
                    processes: {
                        all: processData.all, running: processData.running, blocked: processData.blocked, sleeping: processData.sleeping,
                        list: processData.list.sort((a, b) => b.cpu - a.cpu).slice(0, 100).map(p => ({
                            pid: p.pid, parentPid: p.parentPid, name: p.name,
                            cpu: Math.round(p.cpu * 100) / 100, memory: Math.round(p.mem * 100) / 100,
                            memRss: p.memRss, state: p.state, user: p.user, priority: p.priority,
                            started: p.started, command: p.command?.substring(0, 200)
                        }))
                    },
                    uptime: { seconds: timeData.uptime, formatted: formatUptime(timeData.uptime) }
                };

                socket.emit('stats', stats);

                // Check for disk
                const [diskLayout, fsSize, diskIO] = await Promise.all([si.diskLayout(), si.fsSize(), si.disksIO()]);
                socket.emit('disk', {
                    disks: diskLayout.map(d => ({ device: d.device, type: d.type, name: d.name, vendor: d.vendor, size: d.size })),
                    partitions: fsSize.map(p => ({ fs: p.fs, type: p.type, size: p.size, used: p.used, available: p.available, usePercent: p.use, mount: p.mount })),
                    io: diskIO ? { readPerSec: diskIO.rIO_sec || 0, writePerSec: diskIO.wIO_sec || 0, readBytesPerSec: diskIO.rIO_bytes || 0, writeBytesPerSec: diskIO.wIO_bytes || 0 } : null
                });

                // Check for network
                const [interfaces, netStats, defaultInterface] = await Promise.all([si.networkInterfaces(), si.networkStats(), si.networkInterfaceDefault()]);
                socket.emit('network', {
                    interfaces: interfaces.map(i => ({ iface: i.iface, ifaceName: i.ifaceName, ip4: i.ip4, ip6: i.ip6, mac: i.mac, type: i.type, speed: i.speed, default: i.iface === defaultInterface })),
                    stats: netStats.map(s => ({ iface: s.iface, rxBytes: s.rx_bytes, txBytes: s.tx_bytes, rxSec: s.rx_sec || 0, txSec: s.tx_sec || 0 })),
                    defaultInterface
                });

            } catch (error) {
                console.error('[TaskManager] Stats error:', error);
            }
        };

        // Command handlers
        socket.on('start-monitoring', () => {
            console.log('[TaskManager] Start monitoring for', socket.id);
            startMonitoring();
        });

        socket.on('stop-monitoring', () => {
            if (monitoringInterval) clearInterval(monitoringInterval);
        });

        socket.on('kill-process', ({ pid }) => {
            console.log('[TaskManager] Request to kill process:', pid);
            if (!pid || isNaN(parseInt(pid))) return;

            const command = os.platform() === 'win32' ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;
            exec(command, (error) => {
                if (error) {
                    socket.emit('process-error', { message: `Failed to kill process ${pid}` });
                } else {
                    socket.emit('process-killed', { pid, success: true });
                }
            });
        });

        socket.on('disconnect', () => {
            console.log('[TaskManager] Client disconnected:', socket.id);
            if (monitoringInterval) clearInterval(monitoringInterval);
        });
    });
}
