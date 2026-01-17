let recentFiles = [];

export const routes = {
    'GET /recent': async (req) => {
        return {
            success: true,
            files: recentFiles.slice(0, 10)
        };
    },

    'POST /recent': async (req) => {
        const { path, name } = req.body;

        if (!path) {
            return { success: false, error: 'Path is required' };
        }

        recentFiles = recentFiles.filter(f => f.path !== path);

        recentFiles.unshift({
            path,
            name: name || path.split('/').pop(),
            opened: new Date().toISOString()
        });

        recentFiles = recentFiles.slice(0, 20);

        return {
            success: true,
            added: { path, name }
        };
    },

    'POST /recent/clear': async (req) => {
        recentFiles = [];
        return { success: true };
    },

    'GET /read': async (req) => {
        const { path } = req.query;

        if (!path) {
            return { success: false, error: 'Path is required' };
        }

        try {
            const { FileSystem } = await import('../../../system/lib/FileSystem.js');

            const content = FileSystem.readFile(path);

            if (content === null) {
                return { success: false, error: 'File not found', path };
            }

            const ext = path.split('.').pop().toLowerCase();
            const languages = {
                js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
                py: 'python', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
                html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
                json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml',
                md: 'markdown', txt: 'plaintext', sh: 'shell', bash: 'shell',
                sql: 'sql', php: 'php', rb: 'ruby', go: 'go', rs: 'rust'
            };

            return {
                success: true,
                path: path,
                name: path.split('/').pop(),
                content: content,
                language: languages[ext] || 'plaintext',
                encoding: 'utf-8',
                size: content.length,
                lineCount: content.split('\n').length
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    'POST /save': async (req) => {
        const { path, content = '' } = req.body;

        if (!path) {
            return { success: false, error: 'Path is required' };
        }

        try {
            const { FileSystem } = await import('../../../system/lib/FileSystem.js');

            const result = FileSystem.writeFile(path, content);

            if (!result) {
                return { success: false, error: 'Failed to save file' };
            }

            recentFiles = recentFiles.filter(f => f.path !== path);
            recentFiles.unshift({
                path,
                name: path.split('/').pop(),
                opened: new Date().toISOString()
            });

            return {
                success: true,
                path: path,
                bytes: content.length,
                saved: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    'POST /new': async (req) => {
        const { path, template = 'empty' } = req.body;

        if (!path) {
            return { success: false, error: 'Path is required' };
        }

        const templates = {
            empty: '',
            html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    \n</body>\n</html>',
            js: '// JavaScript File\n\n',
            css: '/* Stylesheet */\n\n',
            json: '{\n    \n}',
            md: '# Title\n\n',
            py: '# Python Script\n\n',
            sh: '#!/bin/bash\n\n'
        };

        const content = templates[template] || '';

        try {
            const { FileSystem } = await import('../../../system/lib/FileSystem.js');

            const result = FileSystem.writeFile(path, content);

            return {
                success: result,
                path: path,
                template: template,
                content: content
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    'GET /info': async (req) => {
        const { path } = req.query;

        if (!path) {
            return { success: false, error: 'Path is required' };
        }

        try {
            const { FileSystem } = await import('../../../system/lib/FileSystem.js');

            const content = FileSystem.readFile(path);

            if (content === null) {
                return { success: false, error: 'File not found' };
            }

            const lines = content.split('\n');
            const words = content.split(/\s+/).filter(w => w).length;
            const chars = content.length;

            return {
                success: true,
                path: path,
                name: path.split('/').pop(),
                stats: {
                    lines: lines.length,
                    words: words,
                    characters: chars,
                    size: `${chars} bytes`
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    'POST /format': async (req) => {
        const { content, language } = req.body;

        let formatted = content;

        if (language === 'json') {
            try {
                formatted = JSON.stringify(JSON.parse(content), null, 2);
            } catch (e) {
                return { success: false, error: 'Invalid JSON' };
            }
        }

        return {
            success: true,
            formatted: formatted
        };
    }
};
