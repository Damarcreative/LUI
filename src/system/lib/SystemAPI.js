

import { FileSystem } from './FileSystem.js';
import { DialogService } from './DialogService.js';

class SystemAPIClass {
    constructor() {

        this.appAPIs = new Map();


        this.services = {
            filesystem: true,
            dialog: true,
            notification: true,
            network: true,
            clipboard: true,
            storage: true
        };
    }


    getForApp(appId, permissions = []) {
        if (!this.appAPIs.has(appId)) {
            this.appAPIs.set(appId, new AppAPI(appId, permissions));
        }
        return this.appAPIs.get(appId);
    }


    isValidPermission(permission) {
        return this.services.hasOwnProperty(permission);
    }


    getAvailablePermissions() {
        return Object.keys(this.services);
    }
}


class AppAPI {
    constructor(appId, permissions = []) {
        this.appId = appId;
        this.permissions = new Set(permissions);


        this._initServices();
    }

    _initServices() {

        this.fs = this._createServiceProxy('filesystem', {
            readFile: (path) => FileSystem.readFile(path),
            writeFile: (path, content) => FileSystem.writeFile(path, content),
            readDir: (path) => FileSystem.readDir(path),
            exists: (path) => FileSystem.exists(path),
            mkdir: (path) => FileSystem.mkdir(path),
            delete: (path) => FileSystem.delete(path),
            getInfo: (path) => FileSystem.getInfo(path)
        });


        this.dialog = this._createServiceProxy('dialog', {
            alert: (message, options) => DialogService.alert(message, options),
            confirm: (message, options) => DialogService.confirm(message, options),
            prompt: (message, defaultValue, options) => DialogService.prompt(message, defaultValue, options),
            danger: (message, options) => DialogService.danger(message, options)
        });


        this.notification = this._createServiceProxy('notification', {
            show: (title, body, options = {}) => {
                console.log(`[Notification] ${title}: ${body}`);

                return Promise.resolve();
            }
        });


        this.network = this._createServiceProxy('network', {
            fetch: (url, options) => fetch(url, options),
            get: (url) => fetch(url).then(r => r.json()),
            post: (url, data) => fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(r => r.json())
        });


        this.clipboard = this._createServiceProxy('clipboard', {
            read: () => navigator.clipboard.readText(),
            write: (text) => navigator.clipboard.writeText(text)
        });


        this.storage = this._createServiceProxy('storage', {
            get: (key) => {
                const data = localStorage.getItem(`app:${this.appId}:${key}`);
                return data ? JSON.parse(data) : null;
            },
            set: (key, value) => {
                localStorage.setItem(`app:${this.appId}:${key}`, JSON.stringify(value));
            },
            remove: (key) => {
                localStorage.removeItem(`app:${this.appId}:${key}`);
            },
            clear: () => {

                const prefix = `app:${this.appId}:`;
                Object.keys(localStorage)
                    .filter(k => k.startsWith(prefix))
                    .forEach(k => localStorage.removeItem(k));
            }
        });


        this.events = {
            emit: (event, data) => {
                window.dispatchEvent(new CustomEvent(`system:${event}`, {
                    detail: { appId: this.appId, data }
                }));
            },
            on: (event, callback) => {
                const handler = (e) => callback(e.detail);
                window.addEventListener(`system:${event}`, handler);
                return () => window.removeEventListener(`system:${event}`, handler);
            }
        };
    }


    _createServiceProxy(serviceName, methods) {
        const self = this;
        return new Proxy(methods, {
            get(target, prop) {

                if (prop === 'hasPermission') {
                    return () => self.permissions.has(serviceName);
                }


                if (!self.permissions.has(serviceName)) {
                    return () => {
                        console.warn(`[SystemAPI] App "${self.appId}" denied access to ${serviceName}.${prop} - missing permission`);
                        return Promise.reject(new Error(`Permission denied: ${serviceName}`));
                    };
                }

                return target[prop];
            }
        });
    }


    hasPermission(permission) {
        return this.permissions.has(permission);
    }


    getAppId() {
        return this.appId;
    }
}


export const SystemAPI = new SystemAPIClass();
