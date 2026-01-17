

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function appApiPlugin() {
    let appRoutes = new Map();

    return {
        name: 'vite-plugin-app-api',

        async configureServer(server) {

            await discoverAppApis(appRoutes);


            server.middlewares.use(async (req, res, next) => {

                if (!req.url?.startsWith('/api/')) {
                    return next();
                }


                const urlParts = req.url.split('?')[0].split('/').filter(Boolean);


                if (urlParts.length < 2) {
                    return sendJson(res, 400, { error: 'Invalid API path' });
                }

                const appId = urlParts[1];
                const apiPath = '/' + urlParts.slice(2).join('/');
                const method = req.method?.toUpperCase() || 'GET';


                const routes = appRoutes.get(appId);
                if (!routes) {
                    return sendJson(res, 404, { error: `App API not found: ${appId}` });
                }


                const handler = findRouteHandler(routes, method, apiPath);
                if (!handler) {
                    return sendJson(res, 404, {
                        error: `Route not found: ${method} ${apiPath}`,
                        availableRoutes: Object.keys(routes)
                    });
                }

                try {

                    let body = {};
                    if (['POST', 'PUT', 'PATCH'].includes(method)) {
                        body = await parseBody(req);
                    }


                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const query = Object.fromEntries(url.searchParams);


                    const params = extractParams(handler.pattern, apiPath);


                    const request = {
                        method,
                        path: apiPath,
                        params,
                        query,
                        body,
                        headers: req.headers
                    };


                    const result = await handler.fn(request);


                    if (result && !res.headersSent) {
                        sendJson(res, 200, result);
                    }

                } catch (error) {
                    console.error(`[API Error] ${appId}${apiPath}:`, error);
                    sendJson(res, 500, { error: error.message });
                }
            });

            console.log('[AppAPI] API middleware installed');
        }
    };
}


async function discoverAppApis(appRoutes) {
    const appsDir = path.resolve(__dirname, 'src/apps');

    if (!fs.existsSync(appsDir)) {
        console.warn('[AppAPI] Apps directory not found');
        return;
    }

    const appFolders = fs.readdirSync(appsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const appFolder of appFolders) {
        const apiIndexPath = path.join(appsDir, appFolder, 'api', 'index.js');

        if (fs.existsSync(apiIndexPath)) {
            try {

                const apiModule = await import(`file://${apiIndexPath}`);

                if (apiModule.routes) {

                    const manifestPath = path.join(appsDir, appFolder, 'manifest.js');
                    let appId = appFolder.toLowerCase();

                    if (fs.existsSync(manifestPath)) {
                        const manifestModule = await import(`file://${manifestPath}`);
                        if (manifestModule.manifest?.id) {
                            appId = manifestModule.manifest.id;
                        }
                    }

                    appRoutes.set(appId, apiModule.routes);
                    console.log(`[AppAPI] Loaded: /api/${appId}/* (${Object.keys(apiModule.routes).length} routes)`);
                }
            } catch (e) {
                console.error(`[AppAPI] Failed to load ${appFolder}/api:`, e.message);
            }
        }
    }

    console.log(`[AppAPI] Discovered ${appRoutes.size} app APIs`);
}


function findRouteHandler(routes, method, path) {
    for (const [pattern, handler] of Object.entries(routes)) {

        const [routeMethod, routePath] = pattern.split(' ');

        if (routeMethod !== method) continue;


        if (matchPath(routePath, path)) {
            return {
                fn: handler,
                pattern: routePath
            };
        }
    }
    return null;
}


function matchPath(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) continue;
        if (patternParts[i] !== pathParts[i]) return false;
    }

    return true;
}


function extractParams(pattern, path) {
    const params = {};
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            const paramName = patternParts[i].slice(1);
            params[paramName] = decodeURIComponent(pathParts[i]);
        }
    }

    return params;
}


function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}


function sendJson(res, status, data) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}
