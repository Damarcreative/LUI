
import pty from 'node-pty';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';


const SHELL = os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';
const SHELL_ARGS = os.platform() === 'win32' ? [] : [];
const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const MAX_BUFFER_SIZE = 10000;


const userSessions = new Map();


export function createSession(userId, cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
    const sessionId = uuidv4();


    const ptyProcess = pty.spawn(SHELL, SHELL_ARGS, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: process.env.HOME || process.cwd(),
        env: {
            ...process.env,
            TERM: 'xterm-256color'
        }
    });

    const session = {
        id: sessionId,
        pid: ptyProcess.pid,
        pty: ptyProcess,
        buffer: '',
        createdAt: new Date(),
        lastActive: new Date(),
        cols,
        rows
    };


    ptyProcess.onData((data) => {
        session.buffer += data;
        if (session.buffer.length > MAX_BUFFER_SIZE) {
            session.buffer = session.buffer.substring(session.buffer.length - MAX_BUFFER_SIZE);
        }
        session.lastActive = new Date();
    });


    ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`[TERM_MGR] Session ${sessionId} exited (code: ${exitCode})`);
        removeSession(userId, sessionId);
    });


    if (!userSessions.has(userId)) {
        userSessions.set(userId, new Map());
    }
    userSessions.get(userId).set(sessionId, session);

    console.log(`[TERM_MGR] Created session ${sessionId} for user ${userId} (PID: ${ptyProcess.pid})`);

    return {
        id: sessionId,
        pid: session.pid,
        cols: session.cols,
        rows: session.rows,
        buffer: session.buffer
    };
}


export function getSession(userId, sessionId) {
    const sessions = userSessions.get(userId);
    if (!sessions) return null;
    return sessions.get(sessionId) || null;
}


export function listSessions(userId) {
    const sessions = userSessions.get(userId);
    if (!sessions) return [];

    return Array.from(sessions.values()).map(s => ({
        id: s.id,
        pid: s.pid,
        createdAt: s.createdAt,
        lastActive: s.lastActive,
        cols: s.cols,
        rows: s.rows
    }));
}


export function removeSession(userId, sessionId) {
    const sessions = userSessions.get(userId);
    if (!sessions) return;

    const session = sessions.get(sessionId);
    if (session) {

        try {
            process.kill(session.pid, 0) && session.pty.kill();
        } catch (e) { }

        sessions.delete(sessionId);
        console.log(`[TERM_MGR] Removed session ${sessionId}`);
    }

    if (sessions.size === 0) {
        userSessions.delete(userId);
    }
}


export function resizeSession(userId, sessionId, cols, rows) {
    const session = getSession(userId, sessionId);
    if (session) {
        try {
            session.pty.resize(cols, rows);
            session.cols = cols;
            session.rows = rows;
        } catch (e) {
            console.error('[TERM_MGR] Resize failed:', e);
        }
    }
}


export function writeToSession(userId, sessionId, data) {
    const session = getSession(userId, sessionId);
    if (session) {
        session.pty.write(data);
        session.lastActive = new Date();
    }
}


export function killAllSessions() {
    for (const sessions of userSessions.values()) {
        for (const session of sessions.values()) {
            try {
                session.pty.kill();
            } catch (e) { }
        }
    }
    userSessions.clear();
    console.log('[TERM_MGR] All sessions killed');
}
