

export class AuthService {
    static sessionToken = null;
    static tokenExpiry = null;
    static isLocked = true;
    static userId = null;
    static permissions = [];


    static API_BASE = 'http://localhost:8080/api';
    static TOKEN_HEADER = 'X-Session-Token';
    static LOCK_STATE_HEADER = 'X-LockScreen-State';


    static async generateToken(password) {
        try {
            const response = await fetch(`${this.API_BASE}/auth/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password,
                    clientId: 'linuxui-web-client'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionToken = data.token;
                this.tokenExpiry = new Date(data.expiresAt);
                this.userId = data.userId;
                this.permissions = data.permissions || [];
                this.isLocked = false;

                console.log('[AuthService] Session started:', {
                    userId: this.userId,
                    expiresAt: this.tokenExpiry.toISOString()
                });

                return true;
            }

            console.error('[AuthService] Unlock failed:', data.error);
            return false;

        } catch (error) {
            console.error('[AuthService] Network error:', error);
            return false;
        }
    }


    static async invalidateToken() {
        if (!this.sessionToken) {
            this.isLocked = true;
            return true;
        }

        try {
            await fetch(`${this.API_BASE}/auth/lock`, {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    [this.TOKEN_HEADER]: this.sessionToken
                },
                body: JSON.stringify({ reason: 'user_initiated' })
            });
        } catch (error) {
            console.error('[AuthService] Lock request failed:', error);
        }


        this.sessionToken = null;
        this.tokenExpiry = null;
        this.isLocked = true;

        console.log('[AuthService] Session ended');
        return true;
    }


    static getAuthHeaders() {
        if (!this.sessionToken || this.isTokenExpired()) {
            throw new Error('SESSION_EXPIRED');
        }

        return {
            [this.TOKEN_HEADER]: this.sessionToken,
            [this.LOCK_STATE_HEADER]: this.isLocked ? 'locked' : 'unlocked'
        };
    }


    static isTokenExpired() {
        if (!this.tokenExpiry) return true;
        return new Date() >= this.tokenExpiry;
    }


    static isSessionActive() {
        return !this.isLocked && this.sessionToken && !this.isTokenExpired();
    }


    static getToken() {
        return this.sessionToken;
    }
}
