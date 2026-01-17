const generateProcesses = () => {
    const processes = [
        { pid: 1, name: 'systemd', user: 'root', cpu: 0.1, memory: 12, status: 'sleeping', priority: 20 },
        { pid: 245, name: 'Xorg', user: 'root', cpu: 2.3, memory: 156, status: 'running', priority: 0 },
        { pid: 1001, name: 'gnome-shell', user: 'user', cpu: 5.2, memory: 512, status: 'running', priority: 20 },
        { pid: 1234, name: 'chrome', user: 'user', cpu: 8.5 + Math.random() * 5, memory: 1200 + Math.floor(Math.random() * 200), status: 'running', priority: 20 },
        { pid: 1235, name: 'chrome (Tab 1)', user: 'user', cpu: 2.1 + Math.random() * 2, memory: 180, status: 'running', priority: 20 },
        { pid: 1236, name: 'chrome (Tab 2)', user: 'user', cpu: 1.8 + Math.random() * 2, memory: 220, status: 'running', priority: 20 },
        { pid: 2345, name: 'code', user: 'user', cpu: 3.1 + Math.random() * 2, memory: 520, status: 'running', priority: 20 },
        { pid: 3456, name: 'nautilus', user: 'user', cpu: 0.2, memory: 85, status: 'sleeping', priority: 20 },
        { pid: 4567, name: 'terminal', user: 'user', cpu: 0.1, memory: 45, status: 'sleeping', priority: 20 },
        { pid: 5678, name: 'node', user: 'user', cpu: 1.5 + Math.random(), memory: 150, status: 'running', priority: 20 },
    ];

    return processes.map(p => ({
        ...p,
        cpu: Math.round(p.cpu * 10) / 10,
        memory: Math.round(p.memory)
    }));
};

export const routes = {
    'GET /processes': async (req) => {
        const { sort = 'cpu', order = 'desc' } = req.query;

        let processes = generateProcesses();

        processes.sort((a, b) => {
            const aVal = a[sort] || 0;
            const bVal = b[sort] || 0;
            return order === 'desc' ? bVal - aVal : aVal - bVal;
        });

        return {
            success: true,
            count: processes.length,
            processes: processes
        };
    },

    'GET /process/:pid': async (req) => {
        const { pid } = req.params;
        const processes = generateProcesses();
        const process = processes.find(p => p.pid === parseInt(pid));

        if (!process) {
            return { success: false, error: `Process not found: ${pid}` };
        }

        return {
            success: true,
            process: {
                ...process,
                threads: Math.floor(Math.random() * 20) + 1,
                handles: Math.floor(Math.random() * 100) + 10,
                startTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                commandLine: `/usr/bin/${process.name}`
            }
        };
    },

    'GET /performance': async (req) => {
        return {
            success: true,
            timestamp: new Date().toISOString(),
            cpu: {
                usage: Math.floor(Math.random() * 30) + 10,
                cores: 8,
                threads: 16,
                speed: '4.20 GHz',
                baseSpeed: '3.60 GHz',
                model: 'Intel Core i7-12700K'
            },
            memory: {
                total: 16384,
                used: Math.floor(Math.random() * 4000) + 4000,
                available: 0,
                cached: 2048,
                percent: 0
            },
            disk: {
                read: Math.floor(Math.random() * 100),
                write: Math.floor(Math.random() * 50),
                readSpeed: `${Math.floor(Math.random() * 100)} MB/s`,
                writeSpeed: `${Math.floor(Math.random() * 50)} MB/s`
            },
            network: {
                sent: Math.floor(Math.random() * 1000),
                received: Math.floor(Math.random() * 5000),
                sentSpeed: `${Math.floor(Math.random() * 10)} MB/s`,
                receivedSpeed: `${Math.floor(Math.random() * 50)} MB/s`
            },
            gpu: {
                usage: Math.floor(Math.random() * 40),
                memory: { used: 1024, total: 8192 },
                temperature: 45 + Math.floor(Math.random() * 20),
                name: 'NVIDIA GeForce RTX 3070'
            }
        };
    },

    'GET /history/cpu': async (req) => {
        const { points = 60 } = req.query;
        const history = [];

        for (let i = 0; i < parseInt(points); i++) {
            history.push({
                time: Date.now() - (parseInt(points) - i) * 1000,
                value: Math.floor(Math.random() * 30) + 10
            });
        }

        return {
            success: true,
            metric: 'cpu',
            points: history
        };
    },

    'GET /history/memory': async (req) => {
        const { points = 60 } = req.query;
        const history = [];
        const baseMemory = 4000;

        for (let i = 0; i < parseInt(points); i++) {
            history.push({
                time: Date.now() - (parseInt(points) - i) * 1000,
                value: baseMemory + Math.floor(Math.random() * 2000)
            });
        }

        return {
            success: true,
            metric: 'memory',
            total: 16384,
            points: history
        };
    },

    'POST /kill': async (req) => {
        const { pid, signal = 'SIGTERM' } = req.body;

        if (!pid) {
            return { success: false, error: 'PID is required' };
        }

        return {
            success: true,
            pid: pid,
            signal: signal,
            message: `Process ${pid} terminated with ${signal}`
        };
    },

    'POST /priority': async (req) => {
        const { pid, priority } = req.body;

        if (!pid || priority === undefined) {
            return { success: false, error: 'PID and priority are required' };
        }

        return {
            success: true,
            pid: pid,
            priority: priority,
            message: `Process ${pid} priority set to ${priority}`
        };
    }
};
