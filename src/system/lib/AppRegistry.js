

import { SystemAPI } from './SystemAPI.js';

class AppRegistryClass {
    constructor() {
        this.apps = {};
    }


    register(manifest) {
        if (!manifest.id) {
            console.error('[AppRegistry] Manifest must have an id');
            return;
        }
        this.apps[manifest.id] = manifest;
        console.log(`[AppRegistry] Registered: ${manifest.id}`);
    }


    getApp(id) {
        return this.apps[id] || null;
    }


    getAllApps() {
        return Object.values(this.apps);
    }


    getDesktopApps() {
        return this.getAllApps().filter(app => app.showOnDesktop !== false);
    }


    getTaskbarApps() {
        return this.getAllApps().filter(app => app.showOnTaskbar !== false);
    }


    async launch(appId, options = {}) {
        const app = this.getApp(appId);
        if (!app) {
            console.warn(`[AppRegistry] App not found: ${appId}`);
            return null;
        }


        if (app.createInstance) {
            try {

                const permissions = app.permissions || ['dialog', 'storage'];
                const systemAPI = SystemAPI.getForApp(appId, permissions);


                return await app.createInstance(options, systemAPI);
            } catch (e) {
                console.error(`[AppRegistry] Error launching ${appId}:`, e);
                return null;
            }
        }

        console.warn(`[AppRegistry] App ${appId} does not have createInstance method`);
        return null;
    }


    async createNewInstance(appId, options = {}) {
        const app = this.getApp(appId);
        if (!app) {
            console.warn(`[AppRegistry] App not found: ${appId}`);
            return null;
        }

        if (app.createInstance) {
            const permissions = app.permissions || ['dialog', 'storage'];
            const systemAPI = SystemAPI.getForApp(appId, permissions);
            return await app.createInstance(options, systemAPI);
        }

        console.warn(`[AppRegistry] App ${appId} does not have createInstance method`);
        return null;
    }


    getAppName(appId) {
        const app = this.getApp(appId);
        return app?.name || appId;
    }


    getSystemAPI(appId) {
        const app = this.getApp(appId);
        const permissions = app?.permissions || ['dialog', 'storage'];
        return SystemAPI.getForApp(appId, permissions);
    }


    generateDesktopIcon(app, col, row) {
        const iconStyle = app.iconStyle || `fill:${app.color || '#666'}`;
        return `
            <div class="desktop-icon" data-app="${app.id}" data-grid="${col},${row}">
                <svg viewBox="0 0 24 24" style="${iconStyle}">${app.iconPath}</svg>
                <span>${app.shortName || app.name}</span>
            </div>
        `;
    }


    generateTaskbarIcon(app) {
        const iconStyle = app.iconStyle || `fill:${app.color || '#666'}`;
        return `
            <div class="taskbar-icon" id="icon-${app.id}" data-app="${app.id}" title="${app.name}">
                <svg viewBox="0 0 24 24" style="${iconStyle}">${app.iconPath}</svg>
            </div>
        `;
    }


    generateStartMenuCard(app) {
        return `
            <div class="app-card" data-app="${app.id}" data-name="${app.name}">
                <div class="app-icon-bg" style="background:${app.color || '#666'}; color:white;">
                    <svg viewBox="0 0 24 24" fill="white" style="width:28px">${app.iconPath}</svg>
                </div>
                <div class="app-name">${app.shortName || app.name}</div>
            </div>
        `;
    }
}


export const AppRegistry = new AppRegistryClass();
