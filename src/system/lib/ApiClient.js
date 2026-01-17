

import { AuthService } from './AuthService.js';

export class ApiClient {
    static BASE_URL = 'http://localhost:8080/api';


    static async request(endpoint, options = {}) {

        if (!AuthService.isSessionActive()) {
            throw new Error('SESSION_LOCKED');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...AuthService.getAuthHeaders(),
            ...options.headers
        };

        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                ...options,
                headers
            });


            if (response.status === 401) {
                const data = await response.json();
                if (data.error === 'TOKEN_EXPIRED' || data.error === 'SESSION_LOCKED') {

                    this.triggerLockScreen();
                    throw new Error('SESSION_EXPIRED');
                }
            }

            return response;

        } catch (error) {
            if (error.message === 'SESSION_EXPIRED' || error.message === 'SESSION_LOCKED') {
                throw error;
            }
            console.error('[ApiClient] Request failed:', error);
            throw error;
        }
    }


    static async get(endpoint) {
        const response = await this.request(endpoint, { method: 'GET' });
        return response.json();
    }


    static async post(endpoint, data) {
        const response = await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    }


    static async delete(endpoint) {
        const response = await this.request(endpoint, { method: 'DELETE' });
        return response.json();
    }


    static triggerLockScreen() {
        const lockScreen = document.getElementById('lockscreen');
        if (lockScreen) {
            lockScreen.style.top = '0';
            const input = document.getElementById('ls-pass');
            if (input) input.value = '';
        }
        AuthService.invalidateToken();
    }
}
