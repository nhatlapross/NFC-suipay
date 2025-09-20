import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import 'express-async-errors';

// Load environment variables
dotenv.config();

// Import configurations
import { connectDatabase } from './config/database';
import { initRedis, redisClient } from './config/redis.config';
import { initSuiClient } from './config/sui.config';

// Import middleware
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';
// import { performanceMiddleware } from './middleware/performance.middleware';

// Import routes
import routes from './routes';
import fastPaymentRoutes from './routes/fastPayment.routes';

// Import services and workers
import { socketService } from './services/socket.service';
import { startPaymentWorkers } from './workers/paymentWorker';
import { startNotificationWorkers } from './workers/notificationWorker';
import { startPriceUpdaterWorker } from './workers/price-updater.worker';

// Import utils
import logger from './utils/logger';

const app: Application = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// Create HTTP server
const server = createServer(app);

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io'
});

// Initialize socket service
socketService.initialize(io);

// Setup Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('authenticate', (data) => {
    const { userId, token: _token } = data;
    
    // TODO: Verify JWT token here
    if (userId) {
      socketService.addUserSocket(userId, socket.id);
      socket.join(`user:${userId}`);
      socket.emit('authenticated', { success: true, userId });
    }
  });
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
    // Find and remove user socket (simplified approach)
    // In production, you might want to store socket-to-user mapping
  });
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message:any) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

// Performance monitoring
// app.use(performanceMiddleware);

// Ensure Redis is connected for each request
app.use(async (_req, _res, next) => {
  try {
    if (!redisClient.isReady) {
      await initRedis();
    }
    next();
  } catch (error) {
    console.error('Redis connection error:', error);
    next(); // Continue without Redis (degraded mode)
  }
});

// Health check
app.get('/health', (_req:any, res:any) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api', routes);
app.use('/api/fast-payment', fastPaymentRoutes);
// Merchant tap-to-pay direct processing endpoints (API key based)

// Static files
app.use('/uploads', express.static('uploads'));

// Error handling middleware (must be last)
app.use(errorMiddleware);

// 404 handler
app.use((_req:any, res:any) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('✅ MongoDB connected');

    // Initialize Redis Cloud before starting server
    console.log('🔄 Initializing Redis Cloud...');
    await initRedis();
    logger.info('📡 Redis Cloud: CONNECTED');

    // Initialize Sui client
    await initSuiClient();
    logger.info('✅ Sui client initialized');

    // Start workers
    startPaymentWorkers();
    startNotificationWorkers();
    startPriceUpdaterWorker();
    logger.info('⚡ Background workers started');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔌 Socket.io server running on http://${HOST}:${PORT}/socket.io`);
      logger.info(`⚡ Background job processing active`);
      logger.info(`🎯 Ready for async NFC payments!`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();