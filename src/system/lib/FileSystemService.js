

import { ApiClient } from './ApiClient.js';
import { AuthService } from './AuthService.js';

export class FileSystemService {

    static async list(path = '/') {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return null;
            }

            const response = await ApiClient.get(`/fs/list?path=${encodeURIComponent(path)}`);

            if (response.success) {
                return response.data;
            }

            console.error('[FS] List failed:', response.error);
            return null;

        } catch (error) {
            console.error('[FS] List error:', error);
            return null;
        }
    }


    static async read(path) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return null;
            }

            const response = await ApiClient.get(`/fs/read?path=${encodeURIComponent(path)}`);

            if (response.success) {
                return response.data;
            }

            console.error('[FS] Read failed:', response.error);
            return null;

        } catch (error) {
            console.error('[FS] Read error:', error);
            return null;
        }
    }


    static async write(path, content, createDirs = false) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return false;
            }

            const response = await ApiClient.post('/fs/write', {
                path,
                content,
                createDirs
            });

            return response.success;

        } catch (error) {
            console.error('[FS] Write error:', error);
            return false;
        }
    }


    static async mkdir(path, recursive = false) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return false;
            }

            const response = await ApiClient.post('/fs/mkdir', {
                path,
                recursive
            });

            return response.success;

        } catch (error) {
            console.error('[FS] Mkdir error:', error);
            return false;
        }
    }


    static async delete(path) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return false;
            }

            const response = await ApiClient.delete(`/fs/delete?path=${encodeURIComponent(path)}`);

            return response.success;

        } catch (error) {
            console.error('[FS] Delete error:', error);
            return false;
        }
    }


    static async rename(path, newName) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return false;
            }

            const response = await ApiClient.post('/fs/rename', {
                path,
                newName
            });

            return response.success;

        } catch (error) {
            console.error('[FS] Rename error:', error);
            return false;
        }
    }


    static async copy(source, destination) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return false;
            }

            const response = await ApiClient.post('/fs/copy', {
                source,
                destination
            });

            return response.success;

        } catch (error) {
            console.error('[FS] Copy error:', error);
            return false;
        }
    }


    static async move(source, destination) {
        try {
            if (!AuthService.isSessionActive()) {
                console.warn('[FS] Session not active');
                return false;
            }

            const response = await ApiClient.post('/fs/move', {
                source,
                destination
            });

            return response.success;

        } catch (error) {
            console.error('[FS] Move error:', error);
            return false;
        }
    }


    static toLegacyFormat(items) {
        const result = {};

        for (const item of items) {
            if (item.type === 'directory') {
                result[item.name] = {};
            } else {
                result[item.name] = 'file';
            }
        }

        return result;
    }
}
