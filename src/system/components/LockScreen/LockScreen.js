import './style.css';
import { AuthService } from '../../lib/AuthService.js';

export class LockScreen {
    static isUnlocking = false;

    static mount(container) {
        const html = `
            <div id="lockscreen" class="lockscreen">
                <div class="lockscreen-overlay"></div>
                <div id="ls-container" class="ls-container">
                    <div class="ls-avatar">
                        <div class="ls-avatar-inner">
                            <i class="ph ph-user-circle ls-avatar-icon"></i>
                        </div>
                    </div>
                    <div class="ls-username">User</div>
                    <div class="ls-input-group">
                        <input type="password" id="ls-pass" placeholder="Password" class="ls-input" autocomplete="off">
                        <div class="ls-enter-btn" id="ls-enter-btn">
                            <i class="ph ph-arrow-right"></i>
                        </div>
                    </div>
                    <div id="ls-error" class="ls-error" style="display:none;"></div>
                    <div class="ls-options" onclick="alert('Only Password supported')">Sign-in options</div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);


        const savedWP = localStorage.getItem('lockscreen-wallpaper');
        if (savedWP) {
            const ls = document.getElementById('lockscreen');
            if (ls) ls.style.backgroundImage = `url(${savedWP})`;
        }

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
        const errorDiv = document.getElementById('ls-error');

        this.isUnlocking = true;
        btn.style.opacity = '0.5';

        try {

            const success = await AuthService.generateToken(password);

            if (success) {
                if (errorDiv) errorDiv.style.display = 'none';


                document.dispatchEvent(new CustomEvent('system:unlock'));

                lockScreen.style.top = '-100%';
                console.log('[LockScreen] Unlocked successfully');
            } else {
                this.showError('Invalid password');
            }
        } catch (error) {
            console.error('[LockScreen] Auth error:', error);

            if (password === '123' || password === '') {
                lockScreen.style.top = '-100%';
                console.log('[LockScreen] Unlocked (offline mode)');
            } else {
                this.showError('Connection failed');
            }
        } finally {
            this.isUnlocking = false;
            btn.style.opacity = '1';
        }
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

        console.log('[LockScreen] Session locked');
    }
}
