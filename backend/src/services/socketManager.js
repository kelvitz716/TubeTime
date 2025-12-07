import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @param {Object} options - Socket.io options
 */
export function initializeSocket(httpServer, options = {}) {
    io = new Server(httpServer, {
        cors: {
            origin: options.corsOrigin || 'http://localhost:5173',
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join user-specific room when authenticated
        socket.on('authenticate', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined room user:${userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
}

/**
 * Get the Socket.io server instance
 * @returns {Server|null}
 */
export function getIO() {
    return io;
}

/**
 * Emit progress update to a specific user
 * @param {number} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Object} data - Progress data
 */
export function emitProgressUpdate(userId, videoId, data) {
    if (io) {
        io.to(`user:${userId}`).emit('progress:update', {
            videoId,
            ...data
        });
    }
}

/**
 * Emit video added event
 * @param {number} userId - User ID
 * @param {Object} video - Video data
 */
export function emitVideoAdded(userId, video) {
    if (io) {
        io.to(`user:${userId}`).emit('video:added', video);
    }
}

/**
 * Emit video deleted event
 * @param {number} userId - User ID
 * @param {string} videoId - Video ID
 */
export function emitVideoDeleted(userId, videoId) {
    if (io) {
        io.to(`user:${userId}`).emit('video:deleted', { videoId });
    }
}

export default {
    initializeSocket,
    getIO,
    emitProgressUpdate,
    emitVideoAdded,
    emitVideoDeleted
};
