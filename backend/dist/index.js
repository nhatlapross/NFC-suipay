"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
require("express-async-errors");
// Load environment variables
dotenv_1.default.config();
// Import configurations
const database_1 = require("./config/database");
const redis_config_1 = require("./config/redis.config");
const sui_config_1 = require("./config/sui.config");
// Import middleware
const cors_middleware_1 = require("./middleware/cors.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
// import { performanceMiddleware } from './middleware/performance.middleware';
// Import routes
const routes_1 = __importDefault(require("./routes"));
const fastPayment_routes_1 = __importDefault(require("./routes/fastPayment.routes"));
// Import services and workers
const socket_service_1 = require("./services/socket.service");
const paymentWorker_1 = require("./workers/paymentWorker");
const notificationWorker_1 = require("./workers/notificationWorker");
// Import utils
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
// Create HTTP server
const server = (0, http_1.createServer)(app);
// Setup Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    path: '/socket.io'
});
// Initialize socket service
socket_service_1.socketService.initialize(io);
// Setup Socket.io connection handling
io.on('connection', (socket) => {
    logger_1.default.info(`Socket connected: ${socket.id}`);
    socket.on('authenticate', (data) => {
        const { userId, token: _token } = data;
        // TODO: Verify JWT token here
        if (userId) {
            socket_service_1.socketService.addUserSocket(userId, socket.id);
            socket.join(`user:${userId}`);
            socket.emit('authenticated', { success: true, userId });
        }
    });
    socket.on('disconnect', () => {
        logger_1.default.info(`Socket disconnected: ${socket.id}`);
        // Find and remove user socket (simplified approach)
        // In production, you might want to store socket-to-user mapping
    });
});
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, compression_1.default)());
app.use(cors_middleware_1.corsMiddleware);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.default.info(message.trim()) } }));
// Rate limiting
app.use('/api/', rateLimit_middleware_1.rateLimiter);
// Performance monitoring
// app.use(performanceMiddleware);
// Ensure Redis is connected for each request
app.use(async (_req, _res, next) => {
    try {
        if (!redis_config_1.redisClient.isReady) {
            await (0, redis_config_1.initRedis)();
        }
        next();
    }
    catch (error) {
        console.error('Redis connection error:', error);
        next(); // Continue without Redis (degraded mode)
    }
});
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
// API Routes
app.use('/api', routes_1.default);
app.use('/api/fast-payment', fastPayment_routes_1.default);
// Merchant tap-to-pay direct processing endpoints (API key based)
// Static files
app.use('/uploads', express_1.default.static('uploads'));
// Error handling middleware (must be last)
app.use(error_middleware_1.errorMiddleware);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});
// Start server
async function startServer() {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDatabase)();
        logger_1.default.info('✅ MongoDB connected');
        // Initialize Redis Cloud before starting server
        console.log('🔄 Initializing Redis Cloud...');
        await (0, redis_config_1.initRedis)();
        logger_1.default.info('📡 Redis Cloud: CONNECTED');
        // Initialize Sui client
        await (0, sui_config_1.initSuiClient)();
        logger_1.default.info('✅ Sui client initialized');
        // Start workers
        (0, paymentWorker_1.startPaymentWorkers)();
        (0, notificationWorker_1.startNotificationWorkers)();
        logger_1.default.info('⚡ Background workers started');
        // Start server
        server.listen(PORT, () => {
            logger_1.default.info(`🚀 Server running on http://${HOST}:${PORT}`);
            logger_1.default.info(`📝 Environment: ${process.env.NODE_ENV}`);
            logger_1.default.info(`🔌 Socket.io server running on http://${HOST}:${PORT}/socket.io`);
            logger_1.default.info(`⚡ Background job processing active`);
            logger_1.default.info(`🎯 Ready for async NFC payments!`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger_1.default.error('Unhandled Rejection:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('Server closed');
        process.exit(0);
    });
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map