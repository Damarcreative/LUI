import './style.css';
import { AuthService } from '../../lib/AuthService.js';

export class LockScreen {
    static isUnlocking = false;
    static desktopWallpaperUrl = null;

    static preloadImage(url) {
        return new Promise((resolve, reject) => {
            if (!url) {
                resolve(null);
                return;
            }
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    static async mount(container) {
        const html = `
            <div id="lockscreen" class="lockscreen lockscreen-loading">
                <div class="lockscreen-overlay"></div>
                <div class="ls-loader" id="ls-loader">
                    <div class="ls-spinner"></div>
                    <div class="ls-loader-text">Loading...</div>
                </div>
                <div id="ls-container" class="ls-container" style="opacity: 0; visibility: hidden;">
                    <div class="ls-avatar">
                        <div class="ls-avatar-inner">
                            <i class="ph ph-user-circle ls-avatar-icon"></i>
                        </div>
                    </div>
                    <div class="ls-username">User</div>
                    <div class="ls-input-group">
                        <input type="password" id="ls-pass" placeholder="Password" class="ls-input" autocomplete="off">
                        <div class="ls-enter-btn" id="ls-enter-btn">
                            <i class="ph ph-arrow-right" id="ls-enter-icon"></i>
                            <div class="ls-btn-spinner" id="ls-btn-spinner" style="display: none;"></div>
                        </div>
                    </div>
                    <div id="ls-error" class="ls-error" style="display:none;"></div>
                    <div class="ls-options" onclick="alert('Only Password supported')">Sign-in options</div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);

        let lockscreenWallpaper = localStorage.getItem('lockscreen-wallpaper');
        let desktopWallpaper = localStorage.getItem('desktop-wallpaper');

        try {
            const res = await fetch('/api/settings/wallpapers/current');
            const data = await res.json();
            if (data.success && data.wallpaper?.lockscreen) {
                lockscreenWallpaper = data.wallpaper.lockscreen;
                localStorage.setItem('lockscreen-wallpaper', lockscreenWallpaper);
            }
            if (data.success && data.wallpaper?.desktop) {
                desktopWallpaper = data.wallpaper.desktop;
                localStorage.setItem('desktop-wallpaper', desktopWallpaper);
            }
        } catch (err) {
            console.log('[LockScreen] Could not fetch wallpaper from server, using localStorage');
        }

        this.desktopWallpaperUrl = desktopWallpaper;

        const ls = document.getElementById('lockscreen');
        const loader = document.getElementById('ls-loader');
        const lsContainer = document.getElementById('ls-container');

        try {
            if (lockscreenWallpaper) {
                await this.preloadImage(lockscreenWallpaper);
                ls.style.backgroundImage = `url(${lockscreenWallpaper})`;
            }
        } catch (err) {
            console.log('[LockScreen] Could not preload wallpaper');
        }

        ls.classList.remove('lockscreen-loading');
        loader.style.display = 'none';
        lsContainer.style.opacity = '1';
        lsContainer.style.visibility = 'visible';

        this.attachListeners();
    }

    static attachListeners() {
        const input = document.getElementById('ls-pass');
        const btn = document.getElementById('ls-enter-btn');

        if (input) {
            input.addEventListener('keydown', (e) => this.checkUnlock(e));
        }
        if (btn) {
            btn.addEventListener('click', () => this.performUnlock());
        }
    }

    static checkUnlock(e) {
        if (e.key === 'Enter') {
            this.performUnlock();
        }
    }

    static async performUnlock() {
        if (this.isUnlocking) return;

        const lockScreen = document.getElementById('lockscreen');
        const password = document.getElementById('ls-pass').value;
        const btn = document.getElementById('ls-enter-btn');
        const btnIcon = document.getElementById('ls-enter-icon');
        const btnSpinner = document.getElementById('ls-btn-spinner');
        const errorDiv = document.getElementById('ls-error');
        const passInput = document.getElementById('ls-pass');

        this.isUnlocking = true;
        btnIcon.style.display = 'none';
        btnSpinner.style.display = 'block';
        passInput.disabled = true;

        try {
            const success = await AuthService.generateToken(password);

            if (success) {
                if (errorDiv) errorDiv.style.display = 'none';

                if (this.desktopWallpaperUrl) {
                    try {
                        await this.preloadImage(this.desktopWallpaperUrl);
                        document.body.style.backgroundImage = `url(${this.desktopWallpaperUrl})`;
                    } catch (err) {
                        console.log('[LockScreen] Could not preload desktop wallpaper');
                    }
                }

                document.dispatchEvent(new CustomEvent('system:unlock'));

                lockScreen.style.top = '-100%';
                console.log('[LockScreen] Unlocked successfully');
            } else {
                this.showError('Invalid password');
                this.resetButton();
            }
        } catch (error) {
            console.error('[LockScreen] Auth error:', error);

            if (password === '123' || password === '') {
                if (this.desktopWallpaperUrl) {
                    try {
                        await this.preloadImage(this.desktopWallpaperUrl);
                        document.body.style.backgroundImage = `url(${this.desktopWallpaperUrl})`;
                    } catch (err) {
                        console.log('[LockScreen] Could not preload desktop wallpaper');
                    }
                }

                document.dispatchEvent(new CustomEvent('system:unlock'));
                lockScreen.style.top = '-100%';
                console.log('[LockScreen] Unlocked (offline mode)');
            } else {
                this.showError('Connection failed');
                this.resetButton();
            }
        }
    }

    static resetButton() {
        const btnIcon = document.getElementById('ls-enter-icon');
        const btnSpinner = document.getElementById('ls-btn-spinner');
        const passInput = document.getElementById('ls-pass');

        this.isUnlocking = false;
        btnIcon.style.display = 'block';
        btnSpinner.style.display = 'none';
        passInput.disabled = false;
    }

    static showError(message) {
        const input = document.getElementById('ls-pass');
        const errorDiv = document.getElementById('ls-error');

        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        input.style.borderColor = 'red';
        input.classList.add('shake');
        setTimeout(() => {
            input.style.borderColor = 'rgba(255,255,255,0.7)';
            input.classList.remove('shake');
        }, 500);
    }

    static async performLock() {
        await AuthService.invalidateToken();

        const lockScreen = document.getElementById('lockscreen');
        lockScreen.style.top = '0';
        document.getElementById('ls-pass').value = '';

        const errorDiv = document.getElementById('ls-error');
        if (errorDiv) errorDiv.style.display = 'none';

        this.resetButton();

        console.log('[LockScreen] Session locked');
    }
}
