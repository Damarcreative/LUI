

import { AppRegistry } from './AppRegistry.js';

class AppLoaderClass {
    initialized = false;
    appServices = new Map();


    async init() {
        if (this.initialized) {
            console.warn('[AppLoader] Already initialized');
            return;
        }

        console.log('[AppLoader] Discovering apps...');


        const manifestModules = import.meta.glob('/src/apps/*/manifest.js', { eager: true });


        import.meta.glob('/src/apps/*/style.css', { eager: true });


        const serviceModules = import.meta.glob('/src/apps/*/services/index.js');

        let appCount = 0;

        for (const path in manifestModules) {
            const module = manifestModules[path];

            if (module.manifest) {
                const manifest = module.manifest;


                const folderMatch = path.match(/\/src\/apps\/([^/]+)\/manifest\.js/);
                const appFolder = folderMatch ? folderMatch[1] : null;


                const servicesPath = path.replace('manifest.js', 'services/index.js');
                if (serviceModules[servicesPath]) {
                    manifest._servicesLoader = serviceModules[servicesPath];
                }


                manifest._folder = appFolder;


                AppRegistry.register(manifest);
                appCount++;

                console.log(`[AppLoader] Loaded: ${manifest.name} (${manifest.id})`);
            } else {
                console.warn(`[AppLoader] No manifest export found in: ${path}`);
            }
        }

        console.log(`[AppLoader] Discovered ${appCount} apps`);
        this.initialized = true;
    }


    async loadAppServices(appId) {
        if (this.appServices.has(appId)) {
            return this.appServices.get(appId);
        }

        const app = AppRegistry.getApp(appId);
        if (!app || !app._servicesLoader) {
            return null;
        }

        try {
            const servicesModule = await app._servicesLoader();
            this.appServices.set(appId, servicesModule);
            console.log(`[AppLoader] Loaded services for: ${appId}`);
            return servicesModule;
        } catch (e) {
            console.error(`[AppLoader] Failed to load services for ${appId}:`, e);
            return null;
        }
    }


    getApps() {
        return AppRegistry.getAllApps();
    }


    isInitialized() {
        return this.initialized;
    }
}


export const AppLoader = new AppLoaderClass();
