import mongoose from 'mongoose';
import logger from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc_payment';
    
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}