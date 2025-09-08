import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(io: SocketIOServer) {
    this.io = io;
    logger.info('Socket service initialized');
  }

  // Track user socket connections
  addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socketId);
    logger.info(`User ${userId} connected with socket ${socketId}`);
  }

  // Remove user socket on disconnect
  removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    logger.info(`User ${userId} disconnected socket ${socketId}`);
  }

  // Emit transaction update to specific user
  emitTransactionUpdate(userId: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach(socketId => {
        this.io?.to(socketId).emit('transaction:update', data);
      });
      logger.info(`Transaction update sent to user ${userId}`, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }
    
    this.io.emit(event, data);
    logger.info(`Broadcast event ${event}`, data);
  }

  // Emit to specific room
  emitToRoom(room: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.to(room).emit(event, data);
    logger.info(`Event ${event} sent to room ${room}`, data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Get all socket IDs for a user
  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }
}

export const socketService = new SocketService();
export default socketService;