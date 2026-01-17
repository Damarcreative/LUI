
import { validateToken, TOKEN_HEADER } from '../../../system/components/LockScreen/api/middleware/auth.js';
import * as SessionManager from '../services/TerminalSessionManager.js';

export function setupSockets(io) {
    const nsp = io.of('/terminal');


    nsp.use((socket, next) => {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.[TOKEN_HEADER] ||
            socket.handshake.query?.token;

        const validation = validateToken(token);

        if (!validation.valid) {
            console.log(`[Terminal] Connection rejected: ${validation.error}`);
            return next(new Error(validation.error));
        }

        socket.session = validation.session;
        next();
    });

    nsp.on('connection', (socket) => {
        const userId = socket.session.userId;
        console.log(`[Terminal] Client connected: ${socket.id} (User: ${userId})`);


        let activeSessionId = null;
        let dataListener = null;
        let exitListener = null;


        const detachCurrentSession = () => {
            if (activeSessionId) {
                const session = SessionManager.getSession(userId, activeSessionId);
                if (session && session.pty) {


                    if (dataListener) session.pty.removeListener('data', dataListener);
                    if (exitListener) session.pty.removeListener('exit', exitListener);
                }
                activeSessionId = null;
                dataListener = null;
                exitListener = null;
            }
        };


        socket.on('list-sessions', () => {
            const sessions = SessionManager.listSessions(userId);
            socket.emit('sessions-list', sessions);
        });


        socket.on('create-session', ({ cols, rows }) => {
            try {
                const session = SessionManager.createSession(userId, cols, rows);
                socket.emit('session-created', {
                    id: session.id,
                    pid: session.pid,
                    cols: session.cols,
                    rows: session.rows
                });
            } catch (err) {
                socket.emit('error', { message: 'Failed to create session: ' + err.message });
            }
        });


        socket.on('attach-session', ({ sessionId }) => {
            detachCurrentSession();

            const session = SessionManager.getSession(userId, sessionId);
            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }

            activeSessionId = sessionId;


            socket.emit('output', session.buffer);


            dataListener = (data) => {
                socket.emit('output', data);
            };

            exitListener = ({ exitCode, signal }) => {
                socket.emit('session-exit', { sessionId, exitCode });
                detachCurrentSession();
            };

            session.pty.on('data', dataListener);
            session.pty.on('exit', exitListener);

            console.log(`[Terminal] Socket ${socket.id} attached to session ${sessionId}`);
        });


        socket.on('input', (data) => {
            if (activeSessionId) {
                SessionManager.writeToSession(userId, activeSessionId, data);
            }
        });


        socket.on('resize', ({ cols, rows }) => {
            if (activeSessionId) {
                SessionManager.resizeSession(userId, activeSessionId, cols, rows);
            }
        });


        socket.on('kill-session', ({ sessionId }) => {
            SessionManager.removeSession(userId, sessionId);
            socket.emit('session-killed', { sessionId });
        });


        socket.on('disconnect', () => {
            console.log(`[Terminal] Client disconnected: ${socket.id}`);
            detachCurrentSession();
        });
    });
}
