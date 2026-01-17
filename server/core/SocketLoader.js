

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import si from 'systeminformation';
import { exec } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { fileURLToPath } from 'url';

import { validateToken, TOKEN_HEADER } from '../middleware/auth.js';

const APPS_DIR = path.resolve(__dirname, '..', '..', 'src', 'apps');


const dependencies = {
    si,           // systeminformation
    exec,         // child_process exec
    os,           // os module
    fs,           // fs module  
    path,         // path module
    validateToken, // auth validation
    TOKEN_HEADER   // auth header name
};

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
