import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { appApiPlugin } from './vite-plugin-app-api.js';

export default defineConfig({
    plugins: [
        appApiPlugin(),
        {
            name: 'block-backend-files',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const restricted = ['/api/', '/services/', '/node_modules/', '/package.json'];

                    if (req.url.includes('/src/apps/') && restricted.some(r => req.url.includes(r))) {
                        res.writeHead(302, { 'Location': `/error.html?code=403&path=${encodeURIComponent(req.url)}` });
                        res.end();
                        return;
                    }
                    next();
                });
            }
        },
        {

            name: 'serve-storage',
            configureServer(server) {
                const storageDir = path.resolve(__dirname, 'storage');

                server.middlewares.use((req, res, next) => {

                    if (req.url?.startsWith('/storage/')) {
                        const filePath = path.join(storageDir, req.url.replace('/storage/', ''));


                        if (!filePath.startsWith(storageDir)) {
                            res.statusCode = 403;
                            res.end('Forbidden');
                            return;
                        }

                        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {

                            const ext = path.extname(filePath).toLowerCase();
                            const mimeTypes = {
                                '.png': 'image/png',
                                '.jpg': 'image/jpeg',
                                '.jpeg': 'image/jpeg',
                                '.gif': 'image/gif',
                                '.webp': 'image/webp',
                                '.svg': 'image/svg+xml',
                                '.json': 'application/json'
                            };

                            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                            res.setHeader('Cache-Control', 'public, max-age=3600');
                            fs.createReadStream(filePath).pipe(res);
                            return;
                        }
                    }
                    next();
                });
            }
        }
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        fs: {

            allow: [
                path.resolve(__dirname, './'),
                path.resolve(__dirname, './storage')
            ],

            deny: [
                '**/src/apps/**/api/**',
                '**/src/apps/**/services/**',
                '**/src/apps/**/node_modules/**',
                '**/src/apps/**/package.json'
            ]
        }
    }
});
