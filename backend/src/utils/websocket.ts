import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import logger from './logger';

interface WSClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

const clients = new Map<string, WSClient>();

export function setupWebSocket(wss: WebSocketServer) {
  // Heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WSClient) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', async (ws: WSClient, req) => {
    try {
      // Extract token from query params
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Missing authentication');
        return;
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
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
        } catch (error) {
          logger.error('WebSocket message error:', error);
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
      
    } catch (error) {
      logger.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  wss.on('close', () => {
    clearInterval(interval);
  });
}

function handleWSMessage(ws: WSClient, message: any) {
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

export function broadcastToUser(userId: string, data: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

export function broadcastToAll(data: any) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}