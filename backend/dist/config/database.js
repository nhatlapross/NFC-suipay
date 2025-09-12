"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
async function connectDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc_payment';
        await mongoose_1.default.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.default.error('MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.default.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.connection.close();
}
//# sourceMappingURL=database.js.map