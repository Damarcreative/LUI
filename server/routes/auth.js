

import { Router } from 'express';
import {
    generateToken,
    validatePassword,
    invalidateToken,
    validateToken,
    TOKEN_HEADER
} from '../middleware/auth.js';

const router = Router();



router.post('/unlock', (req, res) => {
    const { password, clientId } = req.body;

    console.log(`[AUTH] Unlock attempt from client: ${clientId || 'unknown'}`);

    if (!validatePassword(password)) {
        console.log(`[AUTH] Invalid password attempt`);
        return res.status(401).json({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Password tidak valid'
        });
    }

    const session = generateToken('user');

    res.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        userId: session.userId,
        permissions: session.permissions
    });
});



router.post('/lock', (req, res) => {
    const token = req.headers[TOKEN_HEADER];
    const { reason } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'TOKEN_MISSING',
            message: 'Session token is required'
        });
    }

    const result = invalidateToken(token);

    if (!result.success) {
        return res.status(404).json({
            success: false,
            error: 'SESSION_NOT_FOUND',
            message: 'Session not found or already invalidated'
        });
    }

    console.log(`[AUTH] Session locked, reason: ${reason || 'user_initiated'}`);

    res.json({
        success: true,
        message: 'Session terminated',
        lockedAt: result.lockedAt.toISOString()
    });
});



router.get('/status', (req, res) => {
    const token = req.headers[TOKEN_HEADER];

    const validation = validateToken(token);

    if (!validation.valid) {
        return res.status(401).json({
            isValid: false,
            error: validation.error,
            message: validation.error === 'TOKEN_EXPIRED'
                ? 'Session telah expired, silakan unlock untuk melanjutkan'
                : 'Session tidak valid'
        });
    }

    const session = validation.session;
    const remainingMs = session.expiresAt.getTime() - Date.now();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    res.json({
        isValid: true,
        isLocked: session.isLocked,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
        remainingSeconds
    });
});

export default router;
