"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
// const allowedOrigins = [
//   'http://localhost:3000',
//   'http://localhost:3001',
//   'https://localhost:3000',
//   'https://localhost:3001',
//   // Mobile app local network
//   'http://192.168.1.3:3001',
//   'https://192.168.1.3:3001',
//   // Production domains
//   'https://nfc-suipay.onrender.com',
//   // Add your frontend domain here when deployed
//   process.env.FRONTEND_URL,
// ].filter(Boolean);
const corsOptions = {
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 86400 // 24 hours
};
exports.corsMiddleware = (0, cors_1.default)(corsOptions);
//# sourceMappingURL=cors.middleware.js.map