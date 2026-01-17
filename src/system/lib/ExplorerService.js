

import { FileSystemService } from './FileSystemService.js';
import { AuthService } from './AuthService.js';


const directoryCache = new Map();

const rawItemsCache = new Map();
const CACHE_TTL = 5000;

export class ExplorerService {

    static async resolvePath(path) {

        const cacheKey = path;
        const cached = directoryCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return cached.data;
        }

        const result = await FileSystemService.list(path);

        if (result && result.items) {
            const legacyFormat = FileSystemService.toLegacyFormat(result.items);


            directoryCache.set(cacheKey, {
                data: legacyFormat,
                timestamp: Date.now()
            });


            rawItemsCache.set(cacheKey, {
                items: result.items,
                timestamp: Date.now()
            });

            return legacyFormat;
        }

        return null;
    }


    static async getItems(path) {

        const cached = rawItemsCache.get(path);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return cached.items;
        }

        const result = await FileSystemService.list(path);

        if (result && result.items) {
            rawItemsCache.set(path, {
                items: result.items,
                timestamp: Date.now()
            });
            return result.items;
        }

        return null;
    }


    static getCachedItems(path) {
        const cached = rawItemsCache.get(path);
        return cached?.items || null;
    }


    static getItemByName(path, name) {
        const items = this.getCachedItems(path);
        if (!items) return null;
        return items.find(item => item.name === name) || null;
    }


    static clearCache(path) {
        directoryCache.delete(path);
        rawItemsCache.delete(path);


        const parentPath = path.split('/').slice(0, -1).join('/') || '/';
        directoryCache.delete(parentPath);
        rawItemsCache.delete(parentPath);
    }


    static isOnline() {
        return AuthService.isSessionActive();
    }
}
