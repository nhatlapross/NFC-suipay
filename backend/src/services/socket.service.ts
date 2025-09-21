import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();
  private merchantSockets: Map<string, Set<string>> = new Map();
  private qrRequestRooms: Map<string, Set<string>> = new Map(); // requestId -> socketIds

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

  // Emit custom event to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach(socketId => {
        this.io?.to(socketId).emit(event, data);
      });
      logger.info(`Event ${event} sent to user ${userId}`, data);
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

  // Track merchant socket connections
  addMerchantSocket(merchantId: string, socketId: string) {
    if (!this.merchantSockets.has(merchantId)) {
      this.merchantSockets.set(merchantId, new Set());
    }
    this.merchantSockets.get(merchantId)?.add(socketId);
    logger.info(`Merchant ${merchantId} connected with socket ${socketId}`);
  }

  // Remove merchant socket
  removeMerchantSocket(merchantId: string, socketId: string) {
    const sockets = this.merchantSockets.get(merchantId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.merchantSockets.delete(merchantId);
      }
    }
    logger.info(`Merchant ${merchantId} disconnected socket ${socketId}`);
  }

  // Join QR request room (for both merchant and potential users)
  joinQRRequestRoom(requestId: string, socketId: string) {
    if (!this.qrRequestRooms.has(requestId)) {
      this.qrRequestRooms.set(requestId, new Set());
    }
    this.qrRequestRooms.get(requestId)?.add(socketId);

    // Join socket.io room
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`qr:${requestId}`);
        logger.info(`Socket ${socketId} joined QR request room: ${requestId}`);
      }
    }
  }

  // Leave QR request room
  leaveQRRequestRoom(requestId: string, socketId: string) {
    const sockets = this.qrRequestRooms.get(requestId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.qrRequestRooms.delete(requestId);
      }
    }

    // Leave socket.io room
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`qr:${requestId}`);
        logger.info(`Socket ${socketId} left QR request room: ${requestId}`);
      }
    }
  }

  // Emit QR payment status update to all subscribers of a request
  emitQRStatusUpdate(requestId: string, status: string, data?: any) {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    const updateData = {
      requestId,
      status,
      timestamp: new Date(),
      ...data
    };

    this.io.to(`qr:${requestId}`).emit('qr:status-update', updateData);
    logger.info(`QR status update sent for request ${requestId}: ${status}`, updateData);
  }

  // Emit to specific merchant
  emitToMerchant(merchantId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    const merchantSocketIds = this.merchantSockets.get(merchantId);
    if (merchantSocketIds && merchantSocketIds.size > 0) {
      merchantSocketIds.forEach(socketId => {
        this.io?.to(socketId).emit(event, data);
      });
      logger.info(`Event ${event} sent to merchant ${merchantId}`, data);
    }
  }

  // Get QR request room participants count
  getQRRoomSize(requestId: string): number {
    return this.qrRequestRooms.get(requestId)?.size || 0;
  }
}

export const socketService = new SocketService();
export default socketService;