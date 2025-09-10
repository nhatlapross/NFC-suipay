"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcastToUser = broadcastToUser;
exports.broadcastToAll = broadcastToAll;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
const clients = new Map();
function setupWebSocket(wss) {
    // Heartbeat interval
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                ws.terminate();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
    wss.on('connection', async (ws, req) => {
        try {
            // Extract token from query params
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            if (!token) {
                ws.close(1008, 'Missing authentication');
                return;
            }
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;
            ws.userId = userId;
            // Add to clients map
            if (userId) {
                clients.set(userId, ws);
            }
            // Setup heartbeat
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            // Handle messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    handleWSMessage(ws, message);
                }
                catch (error) {
                    logger_1.default.error('WebSocket message error:', error);
                }
            });
            // Handle close
            ws.on('close', () => {
                if (ws.userId) {
                    clients.delete(ws.userId);
                }
            });
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to NFC Payment WebSocket',
            }));
        }
        catch (error) {
            logger_1.default.error('WebSocket connection error:', error);
            ws.close(1008, 'Authentication failed');
        }
    });
    wss.on('close', () => {
        clearInterval(interval);
    });
}
function handleWSMessage(ws, message) {
    switch (message.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        case 'subscribe':
            // Handle subscription to events
            break;
        case 'unsubscribe':
            // Handle unsubscription
            break;
        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type',
            }));
    }
}
function broadcastToUser(userId, data) {
    const client = clients.get(userId);
    if (client && client.readyState === ws_1.WebSocket.OPEN) {
        client.send(JSON.stringify(data));
    }
}
function broadcastToAll(data) {
    clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
//# sourceMappingURL=websocket.js.map