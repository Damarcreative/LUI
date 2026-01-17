import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import authRoutes from '../src/system/components/LockScreen/api/routes.js';


import { loadAppRoutes, loadAppSockets } from './core/AppLoader.js';


import { killAllSessions } from '../src/apps/Terminal/services/TerminalSessionManager.js';



const PORT = process.env.PORT || 8000;
const STORAGE_DIR = path.resolve(__dirname, '../storage');



const app = express();

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Session-Token', 'X-LockScreen-State']
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`[HTTP] ${req.method} ${req.url} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
});



app.use('/storage', express.static(STORAGE_DIR, {
    maxAge: '1h',
    etag: true
}));
console.log('[ROUTES] Static: Storage -> /storage');



app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), version: '1.0.0' });
});



app.use('/api/auth', authRoutes);
console.log('[ROUTES] Core: Auth -> /api/auth');







function setup404Handler() {
    app.use((req, res) => {

        if (req.accepts('html')) {
            const errorPagePath = path.resolve(__dirname, '../public/error.html');
            if (fs.existsSync(errorPagePath)) {
                return res.status(404).sendFile(errorPagePath);
            }
        }


        res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`
        });
    });
}



function setupErrorHandler() {
    app.use((err, req, res, next) => {
        console.error('[ERROR]', err);
        res.status(err.status || 500).json({ success: false, error: err.code || 'INTERNAL_ERROR', message: err.message });
    });
}



const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
    cors: { origin: true, methods: ['GET', 'POST'], credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000
});


async function startServer() {



    try {
        await loadAppSockets(io);
    } catch (error) {
        console.error('[SERVER] Failed to load app sockets:', error);
    }


    console.log('[SERVER] Loading app routes...');
    let appRoutes = [];
    try {
        appRoutes = await loadAppRoutes(app);
        console.log('[SERVER] Loaded', appRoutes.length, 'app routes');
    } catch (error) {
        console.error('[SERVER] Failed to load app routes:', error);
    }


    setup404Handler();
    setupErrorHandler();

    httpServer.listen(PORT, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                                                              ║');
        console.log('║   🐧 LinuxUI Backend Server                                  ║');
        console.log('║                                                              ║');
        console.log(`║   HTTP API:    http://localhost:${PORT}/api                    ║`);
        console.log(`║   WebSocket:   ws://localhost:${PORT}/terminal                 ║`);
        console.log(`║   System WS:   ws://localhost:${PORT}/system                   ║`);
        console.log('║                                                              ║');
        console.log('║   Core Routes:                                               ║');
        console.log('║   └─ Auth: /api/auth                                         ║');
        console.log('║                                                              ║');
        console.log('║   App Routes (auto-loaded):                                  ║');

        if (appRoutes.length === 0) {
            console.log('║   └─ (none)                                                  ║');
        } else {
            appRoutes.forEach((r, i) => {
                const prefix = i === appRoutes.length - 1 ? '└─' : '├─';
                const line = `   ${prefix} ${r.app}: ${r.mountPath}`;
                console.log(`║${line.padEnd(62)}║`);
            });
        }

        console.log('║                                                              ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
    });
}

startServer();



function gracefulShutdown(signal) {
    console.log(`\n[SERVER] Received ${signal}, shutting down...`);
    killAllSessions();
    httpServer.close(() => { console.log('[SERVER] Closed'); process.exit(0); });
    setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, httpServer, io };
