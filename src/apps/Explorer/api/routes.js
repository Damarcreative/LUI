import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const mountPath = '/api/fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FS_ROOT = process.env.FS_ROOT || process.env.HOME || path.resolve(__dirname, '..', '..', '..', '..', 'server', 'desktop-root');

console.log(`[FS] Filesystem root: ${FS_ROOT}`);

function resolveSandboxPath(userPath) {
    if (!userPath) return { valid: false, error: 'Path is required' };
    const normalizedPath = path.normalize(userPath).replace(/^(\.\.((\/|\\)|$))+/, '');
    const resolvedPath = path.resolve(FS_ROOT, normalizedPath);
    if (!resolvedPath.startsWith(FS_ROOT)) return { valid: false, error: 'Access denied' };
    return { valid: true, resolvedPath };
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes === null) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

async function getItemInfo(itemPath, name) {
    try {
        const stats = await fs.stat(itemPath);
        const isDir = stats.isDirectory();
        return {
            name, type: isDir ? 'directory' : 'file',
            size: isDir ? null : stats.size,
            sizeFormatted: formatSize(isDir ? null : stats.size),
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            modifiedFormatted: stats.mtime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            isHidden: name.startsWith('.'),
            permissions: isDir ? 'drwxr-xr-x' : '-rw-r--r--',
            mode: (stats.mode & 0o777).toString(8).padStart(3, '0'),
            owner: 'user'
        };
    } catch (error) {
        return { name, type: 'unknown', error: error.message };
    }
}

(async () => {
    try { await fs.access(FS_ROOT); }
    catch {
        await fs.mkdir(FS_ROOT, { recursive: true });
        console.log(`[FS] Created root directory: ${FS_ROOT}`);
    }
})();

export function setupRoutes(router, { authMiddleware, FTPClient }) {
    router.use(authMiddleware);

    router.get('/list', async (req, res) => {
        const userPath = req.query.path || '/';
        const pathResult = resolveSandboxPath(userPath);
        if (!pathResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH', message: pathResult.error });
        try {
            const stats = await fs.stat(pathResult.resolvedPath);
            if (!stats.isDirectory()) return res.status(400).json({ success: false, error: 'NOT_A_DIRECTORY' });
            const entries = await fs.readdir(pathResult.resolvedPath);
            const items = await Promise.all(entries.map(name => getItemInfo(path.join(pathResult.resolvedPath, name), name)));
            items.sort((a, b) => (a.type === 'directory' && b.type !== 'directory') ? -1 : (a.type !== 'directory' && b.type === 'directory') ? 1 : a.name.localeCompare(b.name));
            res.json({ success: true, data: { path: userPath, items } });
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).json({ success: false, error: 'NOT_FOUND' });
            res.status(500).json({ success: false, error: 'LIST_ERROR' });
        }
    });

    router.get('/read', async (req, res) => {
        const userPath = req.query.path;
        if (!userPath) return res.status(400).json({ success: false, error: 'MISSING_PATH' });
        const pathResult = resolveSandboxPath(userPath);
        if (!pathResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            const stats = await fs.stat(pathResult.resolvedPath);
            if (stats.isDirectory()) return res.status(400).json({ success: false, error: 'IS_DIRECTORY' });
            if (stats.size > 10 * 1024 * 1024) return res.status(413).json({ success: false, error: 'FILE_TOO_LARGE' });
            const content = await fs.readFile(pathResult.resolvedPath, 'utf-8');
            res.json({ success: true, data: { path: userPath, content, size: stats.size } });
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).json({ success: false, error: 'NOT_FOUND' });
            res.status(500).json({ success: false, error: 'READ_ERROR' });
        }
    });

    router.post('/write', async (req, res) => {
        const { path: userPath, content, createDirs = false } = req.body;
        if (!userPath) return res.status(400).json({ success: false, error: 'MISSING_PATH' });
        if (content === undefined) return res.status(400).json({ success: false, error: 'MISSING_CONTENT' });
        const pathResult = resolveSandboxPath(userPath);
        if (!pathResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            if (createDirs) await fs.mkdir(path.dirname(pathResult.resolvedPath), { recursive: true });
            await fs.writeFile(pathResult.resolvedPath, content, 'utf-8');
            const stats = await fs.stat(pathResult.resolvedPath);
            res.json({ success: true, data: { path: userPath, size: stats.size } });
        } catch (error) {
            res.status(500).json({ success: false, error: 'WRITE_ERROR' });
        }
    });

    router.post('/mkdir', async (req, res) => {
        const { path: userPath, recursive = false } = req.body;
        if (!userPath) return res.status(400).json({ success: false, error: 'MISSING_PATH' });
        const pathResult = resolveSandboxPath(userPath);
        if (!pathResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            await fs.mkdir(pathResult.resolvedPath, { recursive });
            res.json({ success: true, data: { path: userPath } });
        } catch (error) {
            if (error.code === 'EEXIST') return res.status(409).json({ success: false, error: 'ALREADY_EXISTS' });
            res.status(500).json({ success: false, error: 'MKDIR_ERROR' });
        }
    });

    router.delete('/delete', async (req, res) => {
        const userPath = req.query.path;
        if (!userPath || userPath === '/') return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        const pathResult = resolveSandboxPath(userPath);
        if (!pathResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            const stats = await fs.stat(pathResult.resolvedPath);
            if (stats.isDirectory()) await fs.rm(pathResult.resolvedPath, { recursive: true });
            else await fs.unlink(pathResult.resolvedPath);
            res.json({ success: true, data: { path: userPath } });
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).json({ success: false, error: 'NOT_FOUND' });
            res.status(500).json({ success: false, error: 'DELETE_ERROR' });
        }
    });

    router.post('/rename', async (req, res) => {
        const { path: userPath, newName } = req.body;
        if (!userPath || !newName) return res.status(400).json({ success: false, error: 'MISSING_PARAMS' });
        if (newName.includes('/') || newName.includes('\\')) return res.status(400).json({ success: false, error: 'INVALID_NAME' });
        const pathResult = resolveSandboxPath(userPath);
        if (!pathResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            const newPath = path.join(path.dirname(pathResult.resolvedPath), newName);
            if (!newPath.startsWith(FS_ROOT)) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
            try { await fs.access(newPath); return res.status(409).json({ success: false, error: 'ALREADY_EXISTS' }); } catch { }
            await fs.rename(pathResult.resolvedPath, newPath);
            res.json({ success: true, data: { oldPath: userPath, newPath: path.join(path.dirname(userPath), newName) } });
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).json({ success: false, error: 'NOT_FOUND' });
            res.status(500).json({ success: false, error: 'RENAME_ERROR' });
        }
    });

    router.post('/copy', async (req, res) => {
        const { source, destination } = req.body;
        if (!source || !destination) return res.status(400).json({ success: false, error: 'MISSING_PARAMS' });
        const srcResult = resolveSandboxPath(source);
        const destResult = resolveSandboxPath(destination);
        if (!srcResult.valid || !destResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            const stats = await fs.stat(srcResult.resolvedPath);
            if (stats.isDirectory()) await fs.cp(srcResult.resolvedPath, destResult.resolvedPath, { recursive: true });
            else await fs.copyFile(srcResult.resolvedPath, destResult.resolvedPath);
            res.json({ success: true, data: { source, destination } });
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).json({ success: false, error: 'NOT_FOUND' });
            res.status(500).json({ success: false, error: 'COPY_ERROR' });
        }
    });

    router.post('/move', async (req, res) => {
        const { source, destination } = req.body;
        if (!source || !destination) return res.status(400).json({ success: false, error: 'MISSING_PARAMS' });
        const srcResult = resolveSandboxPath(source);
        const destResult = resolveSandboxPath(destination);
        if (!srcResult.valid || !destResult.valid) return res.status(400).json({ success: false, error: 'INVALID_PATH' });
        try {
            await fs.rename(srcResult.resolvedPath, destResult.resolvedPath);
            res.json({ success: true, data: { source, destination } });
        } catch (error) {
            if (error.code === 'ENOENT') return res.status(404).json({ success: false, error: 'NOT_FOUND' });
            if (error.code === 'EXDEV') {
                try {
                    const stats = await fs.stat(srcResult.resolvedPath);
                    if (stats.isDirectory()) { await fs.cp(srcResult.resolvedPath, destResult.resolvedPath, { recursive: true }); await fs.rm(srcResult.resolvedPath, { recursive: true }); }
                    else { await fs.copyFile(srcResult.resolvedPath, destResult.resolvedPath); await fs.unlink(srcResult.resolvedPath); }
                    return res.json({ success: true, data: { source, destination } });
                } catch { }
            }
            res.status(500).json({ success: false, error: 'MOVE_ERROR' });
        }
    });

    const ftpConnections = new Map();

    router.post('/network/connect', async (req, res) => {
        if (!FTPClient) {
            return res.status(501).json({
                success: false,
                error: 'FTP_NOT_AVAILABLE',
                message: 'FTP support not installed. Run: npm install basic-ftp'
            });
        }

        const { protocol, server, port, username, password, share } = req.body;

        if (!server) {
            return res.status(400).json({ success: false, error: 'MISSING_SERVER' });
        }

        if (protocol !== 'ftp' && protocol !== 'ftps') {
            return res.status(400).json({
                success: false,
                error: 'UNSUPPORTED_PROTOCOL',
                message: `Protocol ${protocol} not yet supported. Only FTP/FTPS available.`
            });
        }

        const connectionId = `${protocol}-${server}-${port || 21}`;

        try {
            const client = new FTPClient();
            client.ftp.verbose = false;

            await client.access({
                host: server,
                port: parseInt(port) || 21,
                user: username || 'anonymous',
                password: password || 'anonymous@',
                secure: protocol === 'ftps'
            });

            ftpConnections.set(connectionId, {
                client,
                server,
                protocol,
                basePath: share || '/'
            });

            console.log(`[FTP] Connected to ${server}`);

            res.json({
                success: true,
                connectionId,
                server,
                protocol,
                message: `Connected to ${server}`
            });

        } catch (error) {
            console.error(`[FTP] Connection failed:`, error.message);
            res.status(500).json({
                success: false,
                error: 'CONNECTION_FAILED',
                message: error.message
            });
        }
    });

    router.get('/network/list', async (req, res) => {
        const { connectionId, path: remotePath = '/' } = req.query;

        if (!connectionId) {
            return res.status(400).json({ success: false, error: 'MISSING_CONNECTION_ID' });
        }

        const conn = ftpConnections.get(connectionId);
        if (!conn) {
            return res.status(404).json({ success: false, error: 'CONNECTION_NOT_FOUND' });
        }

        try {
            const list = await conn.client.list(remotePath);

            const items = list.map(item => ({
                name: item.name,
                type: item.isDirectory ? 'directory' : 'file',
                size: item.isDirectory ? null : item.size,
                sizeFormatted: item.isDirectory ? '-' : formatSize(item.size),
                modified: item.modifiedAt ? item.modifiedAt.toISOString() : null,
                modifiedFormatted: item.modifiedAt ? item.modifiedAt.toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '-',
                permissions: item.rawModifiedAt || '-',
                isHidden: item.name.startsWith('.'),
                owner: item.user || 'unknown'
            }));

            items.sort((a, b) => {
                if (a.type === 'directory' && b.type !== 'directory') return -1;
                if (a.type !== 'directory' && b.type === 'directory') return 1;
                return a.name.localeCompare(b.name);
            });

            res.json({
                success: true,
                data: {
                    path: remotePath,
                    server: conn.server,
                    connectionId,
                    items
                }
            });

        } catch (error) {
            console.error(`[FTP] List failed:`, error.message);
            res.status(500).json({
                success: false,
                error: 'LIST_FAILED',
                message: error.message
            });
        }
    });

    router.post('/network/disconnect', async (req, res) => {
        const { connectionId } = req.body;

        if (!connectionId) {
            return res.status(400).json({ success: false, error: 'MISSING_CONNECTION_ID' });
        }

        const conn = ftpConnections.get(connectionId);
        if (!conn) {
            return res.status(404).json({ success: false, error: 'CONNECTION_NOT_FOUND' });
        }

        try {
            conn.client.close();
            ftpConnections.delete(connectionId);
            console.log(`[FTP] Disconnected from ${conn.server}`);

            res.json({ success: true, message: `Disconnected from ${conn.server}` });
        } catch (error) {
            res.status(500).json({ success: false, error: 'DISCONNECT_FAILED' });
        }
    });

    router.get('/network/connections', (req, res) => {
        const connections = [];
        for (const [id, conn] of ftpConnections) {
            connections.push({
                connectionId: id,
                server: conn.server,
                protocol: conn.protocol
            });
        }
        res.json({ success: true, connections });
    });
}
