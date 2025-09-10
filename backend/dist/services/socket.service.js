"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class SocketService {
    io = null;
    userSockets = new Map();
    initialize(io) {
        this.io = io;
        logger_1.default.info('Socket service initialized');
    }
    // Track user socket connections
    addUserSocket(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)?.add(socketId);
        logger_1.default.info(`User ${userId} connected with socket ${socketId}`);
    }
    // Remove user socket on disconnect
    removeUserSocket(userId, socketId) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        logger_1.default.info(`User ${userId} disconnected socket ${socketId}`);
    }
    // Emit transaction update to specific user
    emitTransactionUpdate(userId, data) {
        if (!this.io) {
            logger_1.default.warn('Socket.io not initialized');
            return;
        }
        const userSocketIds = this.userSockets.get(userId);
        if (userSocketIds && userSocketIds.size > 0) {
            userSocketIds.forEach(socketId => {
                this.io?.to(socketId).emit('transaction:update', data);
            });
            logger_1.default.info(`Transaction update sent to user ${userId}`, data);
        }
    }
    // Emit custom event to specific user
    emitToUser(userId, event, data) {
        if (!this.io) {
            logger_1.default.warn('Socket.io not initialized');
            return;
        }
        const userSocketIds = this.userSockets.get(userId);
        if (userSocketIds && userSocketIds.size > 0) {
            userSocketIds.forEach(socketId => {
                this.io?.to(socketId).emit(event, data);
            });
            logger_1.default.info(`Event ${event} sent to user ${userId}`, data);
        }
    }
    // Broadcast to all connected clients
    broadcast(event, data) {
        if (!this.io) {
            logger_1.default.warn('Socket.io not initialized');
            return;
        }
        this.io.emit(event, data);
        logger_1.default.info(`Broadcast event ${event}`, data);
    }
    // Emit to specific room
    emitToRoom(room, event, data) {
        if (!this.io) {
            logger_1.default.warn('Socket.io not initialized');
            return;
        }
        this.io.to(room).emit(event, data);
        logger_1.default.info(`Event ${event} sent to room ${room}`, data);
    }
    // Get connected users count
    getConnectedUsersCount() {
        return this.userSockets.size;
    }
    // Get all socket IDs for a user
    getUserSockets(userId) {
        const sockets = this.userSockets.get(userId);
        return sockets ? Array.from(sockets) : [];
    }
}
exports.socketService = new SocketService();
exports.default = exports.socketService;
//# sourceMappingURL=socket.service.js.map