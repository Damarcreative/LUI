/**
 * TaskManager System API Routes
 * 
 * Self-contained routes for system monitoring.
 * Uses dependencies provided by appLoader (si, exec, os)
 */

// Mount path
export const mountPath = '/api/system';

// Setup routes - receives router and dependencies from appLoader
export function setupRoutes(router, { authMiddleware, si, exec, os }) {
    router.use(authMiddleware);

    router.get('/stats', async (req, res) => {
        try {
            const [cpuData, cpuLoad, memData, processData, timeData] = await Promise.all([
                si.cpu(), si.currentLoad(), si.mem(), si.processes(), si.time()
            ]);

            const formatUptime = (s) => {
                const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
                const m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
                return (d > 0 ? `${d}d ` : '') + `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
            };

            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                data: {
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
                }
            });
        } catch (error) {
            console.error('[SYSTEM] Stats error:', error);
            res.status(500).json({ success: false, error: 'STATS_ERROR' });
        }
    });

    router.get('/disk', async (req, res) => {
        try {
            const [diskLayout, fsSize, diskIO] = await Promise.all([si.diskLayout(), si.fsSize(), si.disksIO()]);
            res.json({
                success: true,
                data: {
                    disks: diskLayout.map(d => ({ device: d.device, type: d.type, name: d.name, vendor: d.vendor, size: d.size })),
                    partitions: fsSize.map(p => ({ fs: p.fs, type: p.type, size: p.size, used: p.used, available: p.available, usePercent: p.use, mount: p.mount })),
                    io: diskIO ? { readPerSec: diskIO.rIO_sec || 0, writePerSec: diskIO.wIO_sec || 0, readBytesPerSec: diskIO.rIO_bytes || 0, writeBytesPerSec: diskIO.wIO_bytes || 0 } : null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'DISK_ERROR' });
        }
    });

    router.get('/network', async (req, res) => {
        try {
            const [interfaces, stats, defaultInterface] = await Promise.all([si.networkInterfaces(), si.networkStats(), si.networkInterfaceDefault()]);
            res.json({
                success: true,
                data: {
                    interfaces: interfaces.map(i => ({ iface: i.iface, ifaceName: i.ifaceName, ip4: i.ip4, ip6: i.ip6, mac: i.mac, type: i.type, speed: i.speed, default: i.iface === defaultInterface })),
                    stats: stats.map(s => ({ iface: s.iface, rxBytes: s.rx_bytes, txBytes: s.tx_bytes, rxSec: s.rx_sec || 0, txSec: s.tx_sec || 0 })),
                    defaultInterface
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'NETWORK_ERROR' });
        }
    });

    router.get('/gpu', async (req, res) => {
        try {
            const graphics = await si.graphics();
            res.json({
                success: true,
                data: {
                    controllers: graphics.controllers.map(g => ({ vendor: g.vendor, model: g.model, vram: g.vram, driverVersion: g.driverVersion })),
                    displays: graphics.displays.map(d => ({ vendor: d.vendor, model: d.model, main: d.main, resolutionX: d.resolutionX, resolutionY: d.resolutionY }))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'GPU_ERROR' });
        }
    });

    router.get('/info', async (req, res) => {
        try {
            const [osInfo, systemInfo, cpuInfo, memInfo] = await Promise.all([si.osInfo(), si.system(), si.cpu(), si.mem()]);
            res.json({
                success: true,
                data: {
                    os: { platform: osInfo.platform, distro: osInfo.distro, release: osInfo.release, kernel: osInfo.kernel, arch: osInfo.arch, hostname: osInfo.hostname },
                    system: { manufacturer: systemInfo.manufacturer, model: systemInfo.model, version: systemInfo.version },
                    cpu: { manufacturer: cpuInfo.manufacturer, brand: cpuInfo.brand, cores: cpuInfo.cores, physicalCores: cpuInfo.physicalCores, speed: cpuInfo.speed },
                    memory: { total: memInfo.total }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'INFO_ERROR' });
        }
    });

    router.post('/kill', async (req, res) => {
        const { pid } = req.body;
        if (!pid || isNaN(parseInt(pid))) return res.status(400).json({ success: false, error: 'INVALID_PID' });

        const command = os.platform() === 'win32' ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;
        exec(command, (error) => {
            if (error) return res.status(500).json({ success: false, error: 'KILL_FAILED', message: error.message });
            res.json({ success: true, message: `Process ${pid} terminated` });
        });
    });
}
