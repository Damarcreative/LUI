
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync, exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_ROOT = path.resolve(__dirname, '../../../../storage');
const WALLPAPER_DIR = path.join(STORAGE_ROOT, 'wallpaper');
const CONFIGS_DIR = path.join(STORAGE_ROOT, 'configs');
const SETTINGS_FILE = path.join(CONFIGS_DIR, 'settings.json');
const SYSTEM_FILE = path.join(CONFIGS_DIR, 'system.json');

if (!fs.existsSync(WALLPAPER_DIR)) fs.mkdirSync(WALLPAPER_DIR, { recursive: true });
if (!fs.existsSync(CONFIGS_DIR)) fs.mkdirSync(CONFIGS_DIR, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, WALLPAPER_DIR),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            cb(null, `${name}-${Date.now()}${ext}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});

function execCommand(cmd, defaultValue = 'N/A') {
    try {
        return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
    } catch {
        return defaultValue;
    }
}

function getCpuInfo() {
    const cpus = os.cpus();
    if (cpus.length === 0) return { model: 'Unknown', cores: 0, speed: 'N/A' };

    return {
        model: cpus[0].model.trim(),
        cores: cpus.length,
        speed: `${cpus[0].speed} MHz`,
        logicalProcessors: cpus.length
    };
}

function getMemoryInfo() {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;

    const formatBytes = (bytes) => {
        const gb = bytes / (1024 ** 3);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(0)} MB`;
    };

    return {
        total: formatBytes(totalBytes),
        used: formatBytes(usedBytes),
        available: formatBytes(freeBytes),
        percentUsed: Math.round((usedBytes / totalBytes) * 100)
    };
}

function getStorageInfo() {
    const platform = os.platform();
    const storage = [];

    try {
        if (platform === 'linux' || platform === 'darwin') {
            const df = execCommand('df -h / 2>/dev/null', '');
            const lines = df.split('\n').slice(1);
            lines.forEach(line => {
                const parts = line.split(/\s+/);
                if (parts.length >= 6) {
                    storage.push({
                        device: parts[0],
                        size: parts[1],
                        used: parts[2],
                        available: parts[3],
                        percentUsed: parts[4],
                        mount: parts[5]
                    });
                }
            });
        } else if (platform === 'win32') {
            const wmic = execCommand('wmic logicaldisk get size,freespace,caption', '');
        }
    } catch (e) {
        console.error('[Settings API] Storage detection error:', e.message);
    }

    return storage.length > 0 ? storage : [{ device: 'Unknown', size: 'N/A' }];
}

function getGpuInfo() {
    const platform = os.platform();

    try {
        if (platform === 'linux') {
            const lspci = execCommand("lspci 2>/dev/null | grep -i 'vga\\|3d\\|display'", '');
            if (lspci) {
                const match = lspci.match(/:\s+(.+)$/m);
                return {
                    model: match ? match[1].trim() : lspci.split(':').pop().trim(),
                    available: true
                };
            }
            const glx = execCommand("glxinfo 2>/dev/null | grep 'Device'", '');
            if (glx) {
                return { model: glx.replace('Device:', '').trim(), available: true };
            }
        }
    } catch (e) { }

    return { model: 'Unknown', available: false };
}

function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const result = {
        wifi: false,
        ethernet: false,
        interfaces: []
    };

    for (const [name, addrs] of Object.entries(interfaces)) {
        const lowerName = name.toLowerCase();

        if (lowerName.includes('wl') || lowerName.includes('wifi') || lowerName.includes('wlan')) {
            result.wifi = true;
        }

        if (lowerName.includes('eth') || lowerName.includes('en') || lowerName.includes('ethernet')) {
            result.ethernet = true;
        }

        if (lowerName === 'lo' || lowerName.includes('loopback')) continue;

        const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
        if (ipv4) {
            result.interfaces.push({
                name: name,
                address: ipv4.address,
                mac: ipv4.mac
            });
        }
    }

    if (os.platform() === 'linux') {
        try {
            const iwconfig = execCommand('iwconfig 2>&1 | grep -v "no wireless"', '');
            if (iwconfig && !iwconfig.includes('no wireless extensions')) {
                result.wifi = true;
            }
        } catch (e) { }
    }

    return result;
}

function getBluetoothInfo() {
    const platform = os.platform();

    try {
        if (platform === 'linux') {
            const bt = execCommand('hciconfig 2>/dev/null', '');
            return { available: bt.includes('hci') };
        }
    } catch (e) { }

    return { available: false };
}

function getPackageVersions() {
    const packages = {};

    packages.nodejs = process.version;

    packages.npm = execCommand('npm --version 2>/dev/null', 'Not installed');

    packages.python = execCommand('python3 --version 2>/dev/null',
        execCommand('python --version 2>/dev/null', 'Not installed'))
        .replace('Python ', '');

    packages.pip = execCommand('pip3 --version 2>/dev/null', 'Not installed').split(' ')[1] || 'Not installed';

    packages.kernel = os.release();

    packages.pacman = execCommand('pacman --version 2>/dev/null | head -1', 'Not installed').match(/v?([\d.]+)/)?.[1] || 'Not installed';
    packages.apt = execCommand('apt --version 2>/dev/null', 'Not installed').split(' ')[1] || 'Not installed';
    packages.dnf = execCommand('dnf --version 2>/dev/null | head -1', 'Not installed');
    packages.yum = execCommand('yum --version 2>/dev/null | head -1', 'Not installed');

    packages.git = execCommand('git --version 2>/dev/null', 'Not installed').replace('git version ', '');

    packages.docker = execCommand('docker --version 2>/dev/null', 'Not installed').match(/[\d.]+/)?.[0] || 'Not installed';

    packages.gcc = execCommand('gcc --version 2>/dev/null | head -1', 'Not installed').match(/[\d.]+/)?.[0] || 'Not installed';

    packages.go = execCommand('go version 2>/dev/null', 'Not installed').match(/go([\d.]+)/)?.[1] || 'Not installed';

    packages.rust = execCommand('rustc --version 2>/dev/null', 'Not installed').match(/[\d.]+/)?.[0] || 'Not installed';

    packages.java = execCommand('java --version 2>/dev/null | head -1', 'Not installed').match(/[\d.]+/)?.[0] || 'Not installed';

    return packages;
}

function isRunningInDocker() {
    try {
        if (fs.existsSync('/.dockerenv')) return true;

        const cgroup = execCommand('cat /proc/1/cgroup 2>/dev/null', '');
        if (cgroup.includes('docker') || cgroup.includes('kubepods')) return true;

        if (process.env.DOCKER_CONTAINER === 'true') return true;

        return false;
    } catch (e) {
        return false;
    }
}

function getFeatureAvailability() {
    const network = getNetworkInfo();
    const bluetooth = getBluetoothInfo();
    const inDocker = isRunningInDocker();

    const wifi = inDocker ? false : network.wifi;
    const bt = inDocker ? false : bluetooth.available;

    return {
        wifi: wifi,
        bluetooth: bt,
        ethernet: network.ethernet,
        docker: inDocker
    };
}

function collectSystemInfo() {
    const cpu = getCpuInfo();
    const memory = getMemoryInfo();
    const storage = getStorageInfo();
    const gpu = getGpuInfo();
    const network = getNetworkInfo();
    const bluetooth = getBluetoothInfo();
    const packages = getPackageVersions();
    const features = getFeatureAvailability();

    const systemInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        osType: os.type(),
        osRelease: os.release(),
        uptime: os.uptime(),
        cpu,
        memory,
        storage,
        gpu,
        network,
        bluetooth,
        packages,
        features,
        collectedAt: new Date().toISOString()
    };

    try {
        fs.writeFileSync(SYSTEM_FILE, JSON.stringify(systemInfo, null, 2));
    } catch (e) {
        console.error('[Settings API] Failed to save system info:', e.message);
    }

    return systemInfo;
}

function loadSystemInfo(forceRefresh = false) {
    if (!forceRefresh && fs.existsSync(SYSTEM_FILE)) {
        try {
            const data = fs.readFileSync(SYSTEM_FILE, 'utf8');
            const cached = JSON.parse(data);

            const cacheAge = Date.now() - new Date(cached.collectedAt).getTime();
            if (cacheAge < 5 * 60 * 1000) {
                return cached;
            }
        } catch (e) { }
    }

    return collectSystemInfo();
}

let systemInfo = collectSystemInfo();

const defaultSettings = {
    appearance: { theme: 'light', accentColor: '#0078d4', fontSize: 14, animations: true, transparency: true },
    wallpaper: { desktop: '/storage/wallpaper/leaf.png', lockscreen: '/storage/wallpaper/Mountain.png' },
    display: { brightness: 80, nightLight: false, nightLightIntensity: 50, resolution: '1920x1080', scaling: 100 },
    sound: { masterVolume: 65, systemSounds: true, notificationSounds: true, outputDevice: 'default' },
    notifications: { enabled: true, showPreviews: true, doNotDisturb: false, quietHours: { enabled: false, start: '22:00', end: '07:00' } },
    privacy: { locationAccess: false, cameraAccess: false, microphoneAccess: false, analytics: true },
    language: { locale: 'en-US', timezone: 'Asia/Jakarta', dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
    power: { screenTimeout: 10, sleepTimeout: 30, powerMode: 'balanced' }
};

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            const loaded = JSON.parse(data);
            return deepMerge(JSON.parse(JSON.stringify(defaultSettings)), loaded);
        }
    } catch (error) {
        console.error('[Settings API] Error loading settings:', error);
    }
    return JSON.parse(JSON.stringify(defaultSettings));
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('[Settings API] Error saving settings:', error);
        return false;
    }
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

let settings = loadSettings();

const developerInfo = {
    name: 'LinuxUI Team',
    version: '1.0.0',
    license: 'MIT License',
    description: 'A modern Linux desktop environment for the web',
    builtWith: ['Node.js', 'JavaScript', 'CSS', 'Express', 'Vite'],
    repository: 'github.com/linuxui/linuxui',
    website: 'linuxui.dev'
};

export function setupRoutes(router, deps) {
    router.use('/wallpapers/static', express.static(WALLPAPER_DIR));

    router.get('/wallpapers', (req, res) => {
        try {
            const files = fs.readdirSync(WALLPAPER_DIR);
            const images = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
            const wallpapers = images.map(f => ({ name: f, url: `/storage/wallpaper/${f}`, thumbnail: `/storage/wallpaper/${f}` }));
            res.json({ success: true, wallpapers });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to list wallpapers' });
        }
    });

    router.get('/wallpapers/current', (req, res) => {
        res.json({ success: true, wallpaper: settings.wallpaper || defaultSettings.wallpaper });
    });

    router.post('/wallpapers/set', (req, res) => {
        const { type, url } = req.body;
        if (!type || !url || !['desktop', 'lockscreen'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid type or URL' });
        }
        if (!settings.wallpaper) settings.wallpaper = { ...defaultSettings.wallpaper };
        settings.wallpaper[type] = url;
        saveSettings(settings);
        res.json({ success: true, wallpaper: settings.wallpaper });
    });

    router.post('/wallpapers/upload', upload.single('wallpaper'), (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        res.json({ success: true, file: { name: req.file.filename, url: `/storage/wallpaper/${req.file.filename}` } });
    });

    router.get('/system', (req, res) => {
        const sys = loadSystemInfo();
        res.json({ success: true, system: sys });
    });

    router.get('/system/full', (req, res) => {
        const sys = loadSystemInfo(true);
        res.json({ success: true, system: sys });
    });

    router.get('/system/packages', (req, res) => {
        const packages = getPackageVersions();
        res.json({ success: true, packages });
    });

    router.get('/features', (req, res) => {
        const features = getFeatureAvailability();
        res.json({ success: true, features });
    });

    router.get('/developer', (req, res) => {
        res.json({ success: true, developer: developerInfo });
    });

    router.get('/all', (req, res) => { settings = loadSettings(); res.json({ success: true, settings }); });
    router.get('/category/:name', (req, res) => {
        settings = loadSettings();
        if (!settings[req.params.name]) return res.json({ success: false, error: 'Category not found' });
        res.json({ success: true, category: req.params.name, settings: settings[req.params.name] });
    });
    router.post('/update', (req, res) => {
        const { category, key, value } = req.body;
        if (!category || key === undefined) return res.json({ success: false, error: 'Invalid request' });
        if (!settings[category]) settings[category] = {};
        settings[category][key] = value;
        saveSettings(settings);
        res.json({ success: true, updated: { category, key, value } });
    });
    router.post('/reset', (req, res) => {
        const { category } = req.body;
        if (category) { settings[category] = JSON.parse(JSON.stringify(defaultSettings[category] || {})); }
        else { settings = JSON.parse(JSON.stringify(defaultSettings)); }
        saveSettings(settings);
        res.json({ success: true, reset: category || 'all' });
    });

    router.get('/themes', (req, res) => res.json({
        success: true, themes: [
            { id: 'light', name: 'Light', preview: '#ffffff' },
            { id: 'dark', name: 'Dark', preview: '#1e1e1e' },
            { id: 'auto', name: 'Auto', preview: 'linear-gradient(#fff, #1e1e1e)' }
        ]
    }));

    router.get('/locales', (req, res) => res.json({
        success: true, locales: [
            { code: 'en-US', name: 'English (US)' },
            { code: 'id-ID', name: 'Bahasa Indonesia' }
        ]
    }));
}

export const routes = {
    'GET /wallpapers': async () => {
        try {
            const files = fs.readdirSync(WALLPAPER_DIR);
            const images = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
            return { success: true, wallpapers: images.map(f => ({ name: f, url: `/storage/wallpaper/${f}`, thumbnail: `/storage/wallpaper/${f}` })) };
        } catch { return { success: false, error: 'Failed to list wallpapers' }; }
    },

    'GET /wallpapers/current': async () => {
        settings = loadSettings();
        return { success: true, wallpaper: settings.wallpaper || defaultSettings.wallpaper };
    },

    'POST /wallpapers/set': async (req) => {
        const { type, url } = req.body || {};
        if (!type || !url || !['desktop', 'lockscreen'].includes(type)) {
            return { success: false, error: 'Invalid type or URL' };
        }
        if (!settings.wallpaper) settings.wallpaper = { ...defaultSettings.wallpaper };
        settings.wallpaper[type] = url;
        saveSettings(settings);
        return { success: true, wallpaper: settings.wallpaper };
    },

    'GET /system': async () => {
        const sys = loadSystemInfo();
        return { success: true, system: sys };
    },

    'GET /system/full': async () => {
        const sys = loadSystemInfo(true);
        return { success: true, system: sys };
    },

    'GET /system/packages': async () => {
        return { success: true, packages: getPackageVersions() };
    },

    'GET /features': async () => {
        return { success: true, features: getFeatureAvailability() };
    },

    'GET /developer': async () => {
        return { success: true, developer: developerInfo };
    },

    'GET /all': async () => { settings = loadSettings(); return { success: true, settings }; },

    'GET /category/:name': async (req) => {
        settings = loadSettings();
        if (!settings[req.params.name]) return { success: false, error: 'Category not found' };
        return { success: true, category: req.params.name, settings: settings[req.params.name] };
    },

    'POST /update': async (req) => {
        const { category, key, value } = req.body || {};
        if (!category || key === undefined) return { success: false, error: 'Invalid request' };
        if (!settings[category]) settings[category] = {};
        settings[category][key] = value;
        saveSettings(settings);
        return { success: true, updated: { category, key, value } };
    },

    'POST /reset': async (req) => {
        const { category } = req.body || {};
        if (category) { settings[category] = JSON.parse(JSON.stringify(defaultSettings[category] || {})); }
        else { settings = JSON.parse(JSON.stringify(defaultSettings)); }
        saveSettings(settings);
        return { success: true, reset: category || 'all' };
    },

    'GET /themes': async () => ({
        success: true, themes: [
            { id: 'light', name: 'Light', preview: '#ffffff' },
            { id: 'dark', name: 'Dark', preview: '#1e1e1e' },
            { id: 'auto', name: 'Auto', preview: 'linear-gradient(#fff, #1e1e1e)' }
        ]
    }),

    'GET /locales': async () => ({
        success: true, locales: [
            { code: 'en-US', name: 'English (US)' },
            { code: 'id-ID', name: 'Bahasa Indonesia' }
        ]
    })
};
