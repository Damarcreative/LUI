

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Router } from 'express';
import { authMiddleware, validateToken, TOKEN_HEADER } from '../../src/system/components/LockScreen/api/middleware/auth.js';
import si from 'systeminformation';
import { exec } from 'child_process';
import os from 'os';

// FTP support - will fail gracefully if not installed
let FTPClient = null;
try {
    const ftp = await import('basic-ftp');
    FTPClient = ftp.Client;
    console.log('[APP_LOADER] basic-ftp loaded');
} catch {
    console.log('[APP_LOADER] basic-ftp not installed - FTP disabled');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_DIR = path.resolve(__dirname, '..', '..', 'src', 'apps');


const dependencies = {
    authMiddleware,
    si,           // systeminformation
    exec,         // child_process exec
    os,           // os module
    fs: fs,       // fs module  
    path,         // path module
    FTPClient,     // basic-ftp Client (null if not installed)
    validateToken, // auth validation
    TOKEN_HEADER   // auth header name
};


function convertRoutesObject(routesObj, router) {
    for (const [key, handler] of Object.entries(routesObj)) {
        const [method, routePath] = key.split(' ');
        const httpMethod = method.toLowerCase();

        if (!['get', 'post', 'put', 'delete', 'patch'].includes(httpMethod)) {
            console.warn(`[APP_LOADER] Invalid method: ${method}`);
            continue;
        }

        router[httpMethod](routePath, async (req, res) => {
            try {
                const result = await handler(req, res, dependencies);
                if (result && !res.headersSent) {
                    res.json(result);
                }
            } catch (error) {
                console.error(`[APP_LOADER] Route error:`, error);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: error.message });
                }
            }
        });
    }
}

export async function loadAppRoutes(app) {
    const loadedRoutes = [];

    if (!fs.existsSync(APPS_DIR)) {
        console.warn('[APP_LOADER] Apps directory not found:', APPS_DIR);
        return loadedRoutes;
    }

    const appDirs = fs.readdirSync(APPS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    console.log('[APP_LOADER] Found apps:', appDirs.join(', '));

    for (const appName of appDirs) {

        let routePath = path.join(APPS_DIR, appName, 'api', 'routes.js');
        if (!fs.existsSync(routePath)) {
            routePath = path.join(APPS_DIR, appName, 'api', 'index.js');
        }
        if (!fs.existsSync(routePath)) {
            continue;
        }

        try {
            const fileUrl = pathToFileURL(routePath).href;
            const routeModule = await import(fileUrl);
            const router = Router();

            let loaded = false;


            if (typeof routeModule.setupRoutes === 'function') {
                routeModule.setupRoutes(router, dependencies);
                loaded = true;
            }

            else if (routeModule.routes && typeof routeModule.routes === 'object') {
                router.use(authMiddleware);
                convertRoutesObject(routeModule.routes, router);
                loaded = true;
            }

            else if (typeof routeModule.default === 'function') {
                routeModule.default(router, dependencies);
                loaded = true;
            }

            if (!loaded) {
                console.warn(`[APP_LOADER] ${appName}: No valid route format found`);
                continue;
            }

            const mountPath = routeModule.mountPath || `/api/${appName.toLowerCase()}`;
            app.use(mountPath, router);

            loadedRoutes.push({ app: appName, mountPath });
            console.log(`[APP_LOADER] ✓ ${appName} -> ${mountPath}`);

        } catch (error) {
            console.error(`[APP_LOADER] ✗ ${appName}:`, error.message);
        }
    }

    return loadedRoutes;
}

export async function loadAppSockets(io) {
    if (!fs.existsSync(APPS_DIR)) {
        console.warn('[SOCKET_LOADER] Apps directory not found:', APPS_DIR);
        return;
    }

    const appDirs = fs.readdirSync(APPS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    console.log('[SOCKET_LOADER] Scanning for socket handlers...');

    let loadedCount = 0;

    for (const appName of appDirs) {
        const socketPath = path.join(APPS_DIR, appName, 'api', 'socket.js');

        if (!fs.existsSync(socketPath)) {
            continue;
        }

        try {
            const fileUrl = pathToFileURL(socketPath).href;
            const socketModule = await import(fileUrl);

            if (typeof socketModule.setupSockets === 'function') {
                await socketModule.setupSockets(io, dependencies);
                console.log(`[SOCKET_LOADER] ✓ ${appName}`);
                loadedCount++;
            } else {
                console.warn(`[SOCKET_LOADER] ✗ ${appName}: setupSockets function not found in api/socket.js`);
            }

        } catch (error) {
            console.error(`[SOCKET_LOADER] ✗ ${appName}:`, error.message);
        }
    }

    console.log(`[SOCKET_LOADER] Loaded ${loadedCount} app socket handlers`);
}
