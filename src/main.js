import './styles/global.css';

// Import Phosphor Icons web font (regular weight)
import '@phosphor-icons/web/regular';

import { WindowManager } from './system/components/WindowManager/WindowManager.js';
import { LockScreen } from './system/components/LockScreen/LockScreen.js';
import { Desktop } from './system/components/Desktop/Desktop.js';
import { Taskbar } from './system/components/Taskbar/Taskbar.js';
import { AppLoader } from './system/lib/AppLoader.js';
import { AuthService } from './system/lib/AuthService.js';

// Security: Invalidate token on refresh/close
window.addEventListener('beforeunload', () => {
    if (AuthService.getToken()) {
        AuthService.invalidateToken();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize System
    console.log('System booting...');

    const app = document.getElementById('app');

    // GLOBAL: Prevent browser's default context menu everywhere
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Init Core
    WindowManager.init();

    // Auto-discover and register all apps from src/apps/
    await AppLoader.init();

    // Mount UI Components
    // Mount UI Components
    // Order matters for Z-Index management
    await LockScreen.mount(app);  // Security: Only mount LockScreen first.

    // Security: Desktop & Taskbar are only injected into DOM after successful unlock
    document.addEventListener('system:unlock', async () => {
        // Prevent double mounting
        if (!document.getElementById('desktop')) {
            Desktop.mount(app);     // Bottom layer
            Taskbar.mount(app);     // Top layer (UI)

            document.body.classList.add('desktop-active');

            console.log('[System] Desktop environment mounted secure');

            // Adjust Z-Index to ensure LockScreen stays on top during transition
            const ls = document.getElementById('lockscreen');
            if (ls) ls.style.zIndex = '999999';
        }
    });
});
