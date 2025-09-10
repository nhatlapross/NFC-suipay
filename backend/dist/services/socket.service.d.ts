import { Server as SocketIOServer } from 'socket.io';
declare class SocketService {
    private io;
    private userSockets;
    initialize(io: SocketIOServer): void;
    addUserSocket(userId: string, socketId: string): void;
    removeUserSocket(userId: string, socketId: string): void;
    emitTransactionUpdate(userId: string, data: any): void;
    emitToUser(userId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    emitToRoom(room: string, event: string, data: any): void;
    getConnectedUsersCount(): number;
    getUserSockets(userId: string): string[];
}
export declare const socketService: SocketService;
export default socketService;
//# sourceMappingURL=socket.service.d.ts.map