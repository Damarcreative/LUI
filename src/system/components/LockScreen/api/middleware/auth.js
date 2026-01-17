/**
 * Authentication Middleware & Token Management
 * 
 * Implements in-memory session token storage with strict validation.
 * Token lifecycle: Generated on unlock -> Validated on each request -> Invalidated on lock
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Token Store (In-Memory)
// ============================================================================

/**
 * @typedef {Object} SessionData
 * @property {string} token - Session token
 * @property {string} userId - User identifier
 * @property {Date} createdAt - Token creation time
 * @property {Date} expiresAt - Token expiry time
 * @property {boolean} isLocked - Whether session is locked
 * @property {Date|null} lockedAt - When session was locked
 */

/** @type {Map<string, SessionData>} */
const tokenStore = new Map();

// Token configuration
const TOKEN_PREFIX = 'sess_';
const TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes
const TOKEN_HEADER = 'x-session-token';

// Demo password (as per Technical Analysis spec)
const DEMO_PASSWORD = '123';

// ============================================================================
// Token Management Functions
// ============================================================================

/**
 * Generate a new session token for a user
 * @param {string} userId - User identifier
 * @returns {SessionData} New session data
 */
export function generateToken(userId = 'user') {
    const token = TOKEN_PREFIX + uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS);

    const sessionData = {
        token,
        userId,
        createdAt: now,
        expiresAt,
        isLocked: false,
        lockedAt: null,
        permissions: ['fs_read', 'fs_write', 'terminal', 'system_info']
    };

    tokenStore.set(token, sessionData);

    console.log(`[AUTH] Token generated for user: ${userId}, expires: ${expiresAt.toISOString()}`);

    return sessionData;
}

/**
 * Validate a session token
 * @param {string} token - Token to validate
 * @returns {{ valid: boolean, error?: string, session?: SessionData }}
 */
export function validateToken(token) {
    if (!token) {
        return { valid: false, error: 'TOKEN_MISSING' };
    }

    const session = tokenStore.get(token);

    if (!session) {
        return { valid: false, error: 'TOKEN_INVALID' };
    }

    if (new Date() >= session.expiresAt) {
        tokenStore.delete(token);
        return { valid: false, error: 'TOKEN_EXPIRED' };
    }

    if (session.isLocked) {
        return { valid: false, error: 'SESSION_LOCKED' };
    }

    return { valid: true, session };
}

/**
 * Invalidate/lock a session token
 * @param {string} token - Token to invalidate
 * @returns {{ success: boolean, lockedAt?: Date }}
 */
export function invalidateToken(token) {
    const session = tokenStore.get(token);

    if (!session) {
        return { success: false };
    }

    const lockedAt = new Date();
    session.isLocked = true;
    session.lockedAt = lockedAt;

    console.log(`[AUTH] Session locked for user: ${session.userId} at ${lockedAt.toISOString()}`);

    return { success: true, lockedAt };
}

/**
 * Check if password is valid
 * @param {string} password - Password to validate
 * @returns {boolean}
 */
export function validatePassword(password) {
    // Demo mode: accept "123" or empty string
    return password === DEMO_PASSWORD || password === '';
}

/**
 * Get session info for a token
 * @param {string} token - Token to look up
 * @returns {SessionData|null}
 */
export function getSession(token) {
    return tokenStore.get(token) || null;
}

/**
 * Clean up expired tokens (call periodically)
 */
export function cleanupExpiredTokens() {
    const now = new Date();
    let cleaned = 0;

    for (const [token, session] of tokenStore.entries()) {
        if (now >= session.expiresAt) {
            tokenStore.delete(token);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`[AUTH] Cleaned up ${cleaned} expired tokens`);
    }
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Authentication middleware for protected routes
 * Checks X-Session-Token header and validates the token
 */
export function authMiddleware(req, res, next) {
    const token = req.headers[TOKEN_HEADER];

    const validation = validateToken(token);

    if (!validation.valid) {
        const errorMessages = {
            'TOKEN_MISSING': 'Session token is required',
            'TOKEN_INVALID': 'Invalid session token',
            'TOKEN_EXPIRED': 'Session has expired, please unlock to continue',
            'SESSION_LOCKED': 'Session is locked, please unlock to continue'
        };

        console.log(`[AUTH] Request rejected: ${validation.error}`);

        return res.status(401).json({
            success: false,
            error: validation.error,
            message: errorMessages[validation.error] || 'Authentication failed'
        });
    }

    // Attach session to request for route handlers
    req.session = validation.session;

    next();
}

// ============================================================================
// Cleanup Interval
// ============================================================================

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

export { TOKEN_HEADER };
