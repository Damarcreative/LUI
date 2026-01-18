import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const mountPath = '/api/media';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const FS_ROOT = process.env.FS_ROOT || process.env.HOME || path.resolve(PROJECT_ROOT, 'server', 'desktop-root');
const CACHE_DIR = path.join(FS_ROOT, '.cache', 'thumbnails');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'storage', 'configs', 'media_center.json');

const MEDIA_EXTENSIONS = {
    music: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.opus'],
    video: ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.wmv', '.flv', '.m4v'],
    photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico']
};

const ALL_MEDIA_EXTENSIONS = [
    ...MEDIA_EXTENSIONS.music,
    ...MEDIA_EXTENSIONS.video,
    ...MEDIA_EXTENSIONS.photo
];

let scannedFolders = [];
let mediaLibrary = [];

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(data);
        if (config.library?.folders && Array.isArray(config.library.folders)) {
            scannedFolders = config.library.folders;
            console.log('[MEDIA] Loaded folders from config:', scannedFolders);
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            scannedFolders = ['/home/user/Music', '/home/user/Videos', '/home/user/Pictures'];
            console.log('[MEDIA] Config not found, using defaults');
            await saveConfig();
        } else {
            console.error('[MEDIA] Error loading config:', error.message);
            scannedFolders = ['/home/user/Music', '/home/user/Videos', '/home/user/Pictures'];
        }
    }
}

async function saveConfig() {
    try {
        let existingConfig = {};
        try {
            const data = await fs.readFile(CONFIG_PATH, 'utf-8');
            existingConfig = JSON.parse(data);
        } catch { }

        existingConfig.library = { folders: scannedFolders };

        const configDir = path.dirname(CONFIG_PATH);
        await fs.mkdir(configDir, { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(existingConfig, null, 2), 'utf-8');
        console.log('[MEDIA] Config saved');
    } catch (error) {
        console.error('[MEDIA] Error saving config:', error.message);
    }
}

function getMediaType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (MEDIA_EXTENSIONS.music.includes(ext)) return 'music';
    if (MEDIA_EXTENSIONS.video.includes(ext)) return 'video';
    if (MEDIA_EXTENSIONS.photo.includes(ext)) return 'photo';
    return null;
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function resolveSandboxPath(userPath) {
    if (!userPath) return { valid: false, error: 'Path is required' };
    const normalizedPath = path.normalize(userPath).replace(/^(\.\.((\/|\\)|$))+/, '');
    const resolvedPath = path.resolve(FS_ROOT, normalizedPath.replace(/^\//, ''));
    if (!resolvedPath.startsWith(FS_ROOT)) return { valid: false, error: 'Access denied' };
    return { valid: true, resolvedPath };
}

async function scanDirectory(dirPath, recursive = true) {
    const items = [];
    const pathResult = resolveSandboxPath(dirPath);
    if (!pathResult.valid) return items;

    try {
        const entries = await fs.readdir(pathResult.resolvedPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(pathResult.resolvedPath, entry.name);
            const relativePath = '/' + path.relative(FS_ROOT, fullPath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                if (recursive && !entry.name.startsWith('.')) {
                    const subItems = await scanDirectory(relativePath, recursive);
                    items.push(...subItems);
                }
            } else {
                const mediaType = getMediaType(entry.name);
                if (mediaType) {
                    try {
                        const stats = await fs.stat(fullPath);
                        items.push({
                            id: Buffer.from(relativePath).toString('base64'),
                            name: path.parse(entry.name).name,
                            filename: entry.name,
                            path: relativePath,
                            type: mediaType,
                            size: stats.size,
                            sizeFormatted: formatSize(stats.size),
                            modified: stats.mtime.toISOString(),
                            modifiedFormatted: stats.mtime.toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            }),
                            extension: path.extname(entry.name).toLowerCase(),
                            folder: path.dirname(relativePath)
                        });
                    } catch (err) {
                        console.error(`[MEDIA] Error reading file stats: ${entry.name}`, err.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[MEDIA] Error scanning directory: ${dirPath}`, error.message);
    }

    return items;
}

async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

(async () => {
    await ensureCacheDir();
    await loadConfig();
    console.log('[MEDIA] Cache directory ready:', CACHE_DIR);
    console.log('[MEDIA] Config path:', CONFIG_PATH);
})();

export function setupRoutes(router, { authMiddleware, validateToken, TOKEN_HEADER }) {

    const validateQueryToken = (req, res, next) => {
        const headerToken = req.headers[TOKEN_HEADER];
        const queryToken = req.query.token;
        const token = headerToken || queryToken;

        if (!token) {
            return res.status(401).json({ success: false, error: 'TOKEN_MISSING' });
        }

        const validation = validateToken(token);
        if (!validation.valid) {
            return res.status(401).json({ success: false, error: validation.error });
        }

        req.session = validation.session;
        next();
    };

    router.get('/stream', validateQueryToken, async (req, res) => {
        const { path: filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }

        const pathResult = resolveSandboxPath(filePath);
        if (!pathResult.valid) {
            return res.status(400).json({ success: false, error: pathResult.error });
        }

        try {
            const stats = await fs.stat(pathResult.resolvedPath);
            if (stats.isDirectory()) {
                return res.status(400).json({ success: false, error: 'Cannot stream directory' });
            }

            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.flac': 'audio/flac',
                '.ogg': 'audio/ogg',
                '.m4a': 'audio/mp4',
                '.aac': 'audio/aac',
                '.wma': 'audio/x-ms-wma',
                '.opus': 'audio/opus',
                '.mp4': 'video/mp4',
                '.mkv': 'video/x-matroska',
                '.avi': 'video/x-msvideo',
                '.mov': 'video/quicktime',
                '.webm': 'video/webm',
                '.wmv': 'video/x-ms-wmv',
                '.flv': 'video/x-flv',
                '.m4v': 'video/x-m4v',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon'
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
                const chunkSize = end - start + 1;

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': contentType
                });

                const stream = fsSync.createReadStream(pathResult.resolvedPath, { start, end });
                stream.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': stats.size,
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes'
                });

                const stream = fsSync.createReadStream(pathResult.resolvedPath);
                stream.pipe(res);
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ success: false, error: 'File not found' });
            }
            res.status(500).json({ success: false, error: 'Stream error' });
        }
    });

    router.get('/thumbnail', validateQueryToken, async (req, res) => {
        const { path: filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }

        const pathResult = resolveSandboxPath(filePath);
        if (!pathResult.valid) {
            return res.status(400).json({ success: false, error: pathResult.error });
        }

        const mediaType = getMediaType(filePath);

        if (mediaType === 'photo') {
            try {
                const stats = await fs.stat(pathResult.resolvedPath);
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.bmp': 'image/bmp',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon'
                };

                res.writeHead(200, {
                    'Content-Length': stats.size,
                    'Content-Type': mimeTypes[ext] || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400'
                });

                const stream = fsSync.createReadStream(pathResult.resolvedPath);
                stream.pipe(res);
            } catch (error) {
                res.status(404).json({ success: false, error: 'Image not found' });
            }
            return;
        }

        if (mediaType === 'music') {
            res.json({ success: true, type: 'music', placeholder: true, icon: 'music-notes' });
            return;
        }

        if (mediaType === 'video') {
            res.json({ success: true, type: 'video', placeholder: true, icon: 'film-strip' });
            return;
        }

        res.status(400).json({ success: false, error: 'Unsupported media type' });
    });

    router.use(authMiddleware);

    router.get('/library', async (req, res) => {
        const { type = 'all', sort = 'name', order = 'asc', search = '' } = req.query;

        let items = [...mediaLibrary];

        if (type !== 'all') {
            items = items.filter(m => m.type === type);
        }

        if (search) {
            const query = search.toLowerCase();
            items = items.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.filename.toLowerCase().includes(query) ||
                m.folder.toLowerCase().includes(query)
            );
        }

        items.sort((a, b) => {
            let aVal, bVal;
            switch (sort) {
                case 'date':
                    aVal = new Date(a.modified);
                    bVal = new Date(b.modified);
                    break;
                case 'size':
                    aVal = a.size;
                    bVal = b.size;
                    break;
                case 'type':
                    aVal = a.type;
                    bVal = b.type;
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }
            if (aVal < bVal) return order === 'desc' ? 1 : -1;
            if (aVal > bVal) return order === 'desc' ? -1 : 1;
            return 0;
        });

        res.json({
            success: true,
            count: items.length,
            type,
            items
        });
    });

    router.get('/scan', async (req, res) => {
        const { path: folderPath, recursive = 'true' } = req.query;

        if (folderPath) {
            const items = await scanDirectory(folderPath, recursive === 'true');
            return res.json({
                success: true,
                path: folderPath,
                count: items.length,
                items
            });
        }

        mediaLibrary = [];
        for (const folder of scannedFolders) {
            const items = await scanDirectory(folder, true);
            mediaLibrary.push(...items);
        }

        const byId = new Map();
        for (const item of mediaLibrary) {
            byId.set(item.id, item);
        }
        mediaLibrary = Array.from(byId.values());

        res.json({
            success: true,
            folders: scannedFolders,
            count: mediaLibrary.length,
            byType: {
                music: mediaLibrary.filter(m => m.type === 'music').length,
                video: mediaLibrary.filter(m => m.type === 'video').length,
                photo: mediaLibrary.filter(m => m.type === 'photo').length
            }
        });
    });

    router.get('/folders', async (req, res) => {
        res.json({
            success: true,
            folders: scannedFolders
        });
    });

    router.post('/folders/add', async (req, res) => {
        const { path: folderPath } = req.body;

        if (!folderPath) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }

        const pathResult = resolveSandboxPath(folderPath);
        if (!pathResult.valid) {
            return res.status(400).json({ success: false, error: pathResult.error });
        }

        try {
            const stats = await fs.stat(pathResult.resolvedPath);
            if (!stats.isDirectory()) {
                return res.status(400).json({ success: false, error: 'Path is not a directory' });
            }
        } catch (error) {
            return res.status(404).json({ success: false, error: 'Directory not found' });
        }

        if (!scannedFolders.includes(folderPath)) {
            scannedFolders.push(folderPath);
            await saveConfig();
        }

        const items = await scanDirectory(folderPath, true);
        for (const item of items) {
            if (!mediaLibrary.find(m => m.id === item.id)) {
                mediaLibrary.push(item);
            }
        }

        res.json({
            success: true,
            folder: folderPath,
            added: items.length,
            totalLibrary: mediaLibrary.length
        });
    });

    router.post('/folders/remove', async (req, res) => {
        const { path: folderPath } = req.body;

        if (!folderPath) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }

        const index = scannedFolders.indexOf(folderPath);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Folder not in list' });
        }

        scannedFolders.splice(index, 1);
        await saveConfig();
        const removedCount = mediaLibrary.length;
        mediaLibrary = mediaLibrary.filter(m => !m.folder.startsWith(folderPath));

        res.json({
            success: true,
            folder: folderPath,
            removed: removedCount - mediaLibrary.length,
            totalLibrary: mediaLibrary.length
        });
    });

    router.get('/item/:id', async (req, res) => {
        const { id } = req.params;
        const item = mediaLibrary.find(m => m.id === id);

        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        res.json({ success: true, item });
    });

    router.get('/stats', async (req, res) => {
        res.json({
            success: true,
            totalItems: mediaLibrary.length,
            byType: {
                music: mediaLibrary.filter(m => m.type === 'music').length,
                video: mediaLibrary.filter(m => m.type === 'video').length,
                photo: mediaLibrary.filter(m => m.type === 'photo').length
            },
            folders: scannedFolders.length,
            totalSize: formatSize(mediaLibrary.reduce((acc, m) => acc + (m.size || 0), 0))
        });
    });

    router.get('/config', async (req, res) => {
        try {
            const data = await fs.readFile(CONFIG_PATH, 'utf-8');
            const config = JSON.parse(data);
            res.json({ success: true, config });
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.json({ success: true, config: {} });
            } else {
                res.status(500).json({ success: false, error: 'CONFIG_READ_ERROR' });
            }
        }
    });

    router.post('/config', async (req, res) => {
        try {
            const { config } = req.body;
            if (!config) {
                return res.status(400).json({ success: false, error: 'MISSING_CONFIG' });
            }

            scannedFolders = config.library?.folders || scannedFolders;

            const configDir = path.dirname(CONFIG_PATH);
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

            console.log('[MEDIA] Config updated via API');
            res.json({ success: true });
        } catch (error) {
            console.error('[MEDIA] Config write error:', error);
            res.status(500).json({ success: false, error: 'CONFIG_WRITE_ERROR' });
        }
    });

    console.log('[MEDIA] Media Center API routes loaded');
}
