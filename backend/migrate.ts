import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './src/config/database';
import { User } from './src/models/User.model';
import { Merchant } from './src/models/Merchant.model';
import { Transaction } from './src/models/Transaction.model';
import { Card } from './src/models/Card.model';
import logger from './src/utils/logger';

interface MigrationEntry {
  version: number;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

class MigrationManager {
  private migrationsCollection = 'migrations';

  async getMigrationCollection() {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    return mongoose.connection.db.collection(this.migrationsCollection);
  }

  async getAppliedMigrations(): Promise<number[]> {
    try {
      const collection = await this.getMigrationCollection();
      const migrations = await collection.find({}).toArray();
      return migrations.map(m => m.version).sort((a, b) => a - b);
    } catch (error) {
      logger.warn('No migration collection found, starting fresh');
      return [];
    }
  }

  async markMigrationAsApplied(version: number, description: string): Promise<void> {
    const collection = await this.getMigrationCollection();
    await collection.insertOne({
      version,
      description,
      appliedAt: new Date(),
    });
  }

  async markMigrationAsReverted(version: number): Promise<void> {
    const collection = await this.getMigrationCollection();
    await collection.deleteOne({ version });
  }

  async runMigrations(targetVersion?: number): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.version));

    if (targetVersion) {
      const targetMigrations = pendingMigrations.filter(m => m.version <= targetVersion);
      for (const migration of targetMigrations.sort((a, b) => a.version - b.version)) {
        await this.runMigration(migration);
      }
    } else {
      for (const migration of pendingMigrations.sort((a, b) => a.version - b.version)) {
        await this.runMigration(migration);
      }
    }
  }

  async rollbackMigrations(targetVersion: number): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationsToRollback = appliedMigrations.filter(v => v > targetVersion);

    for (const version of migrationsToRollback.sort((a, b) => b - a)) {
      const migration = migrations.find(m => m.version === version);
      if (migration) {
        await this.rollbackMigration(migration);
      }
    }
  }

  private async runMigration(migration: MigrationEntry): Promise<void> {
    logger.info(`Running migration ${migration.version}: ${migration.description}`);
    try {
      await migration.up();
      await this.markMigrationAsApplied(migration.version, migration.description);
      logger.info(`Migration ${migration.version} completed successfully`);
    } catch (error) {
      logger.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  private async rollbackMigration(migration: MigrationEntry): Promise<void> {
    logger.info(`Rolling back migration ${migration.version}: ${migration.description}`);
    try {
      await migration.down();
      await this.markMigrationAsReverted(migration.version);
      logger.info(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      logger.error(`Rollback of migration ${migration.version} failed:`, error);
      throw error;
    }
  }
}

const migrations: MigrationEntry[] = [
  {
    version: 1,
    description: 'Create database indexes',
    up: async () => {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ phoneNumber: 1 }, { unique: true });
      await User.collection.createIndex({ walletAddress: 1 }, { unique: true, sparse: true });
      await User.collection.createIndex({ fullName: 'text', email: 'text' });

      await Merchant.collection.createIndex({ merchantId: 1 }, { unique: true });
      await Merchant.collection.createIndex({ email: 1 }, { unique: true });
      await Merchant.collection.createIndex({ walletAddress: 1 }, { unique: true });
      await Merchant.collection.createIndex({ merchantName: 'text', businessType: 'text' });

      await Transaction.collection.createIndex({ txHash: 1 }, { unique: true, sparse: true });
      await Transaction.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
      await Transaction.collection.createIndex({ merchantId: 1, status: 1, createdAt: -1 });
      await Transaction.collection.createIndex({ createdAt: -1 });

      await Card.collection.createIndex({ cardUuid: 1 }, { unique: true });
      await Card.collection.createIndex({ cardNumber: 1 }, { unique: true });
      await Card.collection.createIndex({ userId: 1, isActive: 1 });
      await Card.collection.createIndex({ expiryDate: 1, isActive: 1 });
    },
    down: async () => {
      await User.collection.dropIndexes();
      await Merchant.collection.dropIndexes();
      await Transaction.collection.dropIndexes();
      await Card.collection.dropIndexes();
    },
  },
  {
    version: 2,
    description: 'Add default admin user',
    up: async () => {
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const adminUser = new User({
          email: 'admin@nfcpayment.com',
          password: 'Admin123!',
          phoneNumber: '+1234567890',
          fullName: 'System Administrator',
          role: 'admin',
          status: 'active',
          kycStatus: 'verified',
          dailyLimit: 100000,
          monthlyLimit: 1000000,
        });
        await adminUser.save();
        logger.info('Default admin user created');
      }
    },
    down: async () => {
      await User.deleteOne({ email: 'admin@nfcpayment.com' });
    },
  },
  {
    version: 3,
    description: 'Update transaction schema for better performance',
    up: async () => {
      await Transaction.collection.createIndex({ 
        fromAddress: 1, 
        toAddress: 1, 
        status: 1 
      });
      await Transaction.collection.createIndex({ 
        type: 1, 
        currency: 1, 
        createdAt: -1 
      });
    },
    down: async () => {
      try {
        await Transaction.collection.dropIndex('fromAddress_1_toAddress_1_status_1');
      } catch (error) {
        logger.warn('Index fromAddress_1_toAddress_1_status_1 not found, skipping');
      }
      try {
        await Transaction.collection.dropIndex('type_1_currency_1_createdAt_-1');
      } catch (error) {
        logger.warn('Index type_1_currency_1_createdAt_-1 not found, skipping');
      }
    },
  },
  {
    version: 4,
    description: 'Add spending limits reset job data',
    up: async () => {
      const now = new Date();
      await Card.updateMany(
        { lastResetDate: { $exists: false } },
        { 
          $set: { 
            lastResetDate: now,
            dailySpent: 0,
            monthlySpent: 0 
          } 
        }
      );
    },
    down: async () => {
      await Card.updateMany(
        {},
        { 
          $unset: { lastResetDate: '' }
        }
      );
    },
  },
  {
    version: 5,
    description: 'Add example card data',
    up: async () => {
      // Create example users first
      const exampleUsers = [
        {
          email: 'user1@example.com',
          password: 'User123!',
          phoneNumber: '+1234567891',
          fullName: 'John Doe',
          role: 'user',
          status: 'active',
          kycStatus: 'verified',
          dailyLimit: 500,
          monthlyLimit: 5000,
        },
        {
          email: 'user2@example.com',
          password: 'User123!',
          phoneNumber: '+1234567892',
          fullName: 'Jane Smith',
          role: 'user',
          status: 'active',
          kycStatus: 'verified',
          dailyLimit: 1000,
          monthlyLimit: 10000,
        },
        {
          email: 'merchant@example.com',
          password: 'Merchant123!',
          phoneNumber: '+1234567893',
          fullName: 'Coffee Shop Owner',
          role: 'merchant',
          status: 'active',
          kycStatus: 'verified',
          dailyLimit: 10000,
          monthlyLimit: 100000,
        }
      ];

      const createdUsers = [];
      for (const userData of exampleUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = new User(userData);
          await user.save();
          createdUsers.push(user);
          logger.info(`Created example user: ${userData.email}`);
        } else {
          createdUsers.push(existingUser);
          logger.info(`User already exists: ${userData.email}`);
        }
      }

      // Create example cards for the users
      const exampleCards = [
        {
          cardUuid: 'nfc-card-001',
          userId: createdUsers[0]._id,
          cardType: 'standard',
          cardNumber: '1234567890123456',
          isActive: true,
          isPrimary: true,
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
        },
        {
          cardUuid: 'nfc-card-002',
          userId: createdUsers[0]._id,
          cardType: 'premium',
          cardNumber: '1234567890123457',
          isActive: true,
          isPrimary: false,
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        },
        {
          cardUuid: 'nfc-card-003',
          userId: createdUsers[1]._id,
          cardType: 'standard',
          cardNumber: '1234567890123458',
          isActive: true,
          isPrimary: true,
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        },
        {
          cardUuid: 'nfc-card-004',
          userId: createdUsers[2]._id,
          cardType: 'corporate',
          cardNumber: '1234567890123459',
          isActive: true,
          isPrimary: true,
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        },
        {
          cardUuid: 'nfc-card-005',
          userId: createdUsers[1]._id,
          cardType: 'premium',
          cardNumber: '1234567890123460',
          isActive: false,
          isPrimary: false,
          blockedAt: new Date(),
          blockedReason: 'Lost card',
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
        }
      ];

      for (const cardData of exampleCards) {
        const existingCard = await Card.findOne({ cardUuid: cardData.cardUuid });
        if (!existingCard) {
          const card = new Card(cardData);
          await card.save();
          logger.info(`Created example card: ${cardData.cardUuid}`);
        } else {
          logger.info(`Card already exists: ${cardData.cardUuid}`);
        }
      }

      logger.info('Example card data migration completed');
    },
    down: async () => {
      // Remove example cards
      const exampleCardUuids = [
        'nfc-card-001',
        'nfc-card-002', 
        'nfc-card-003',
        'nfc-card-004',
        'nfc-card-005'
      ];
      
      await Card.deleteMany({ cardUuid: { $in: exampleCardUuids } });
      
      // Remove example users
      const exampleEmails = [
        'user1@example.com',
        'user2@example.com', 
        'merchant@example.com'
      ];
      
      await User.deleteMany({ email: { $in: exampleEmails } });
      
      logger.info('Example card data removed');
    },
  },
];

async function runCLI() {
  const command = process.argv[2];
  const version = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  try {
    await connectDatabase();
    logger.info('Connected to database for migrations');

    const migrationManager = new MigrationManager();

    switch (command) {
      case 'up':
        await migrationManager.runMigrations(version);
        logger.info('All migrations completed successfully');
        break;

      case 'down':
        if (!version) {
          logger.error('Version required for rollback');
          process.exit(1);
        }
        await migrationManager.rollbackMigrations(version);
        logger.info('Rollback completed successfully');
        break;

      case 'status':
        const appliedMigrations = await migrationManager.getAppliedMigrations();
        
        logger.info('Migration Status:');
        migrations.forEach(migration => {
          const status = appliedMigrations.includes(migration.version) ? '✓' : '✗';
          logger.info(`${status} Migration ${migration.version}: ${migration.description}`);
        });
        break;

      case 'create':
        const newVersion = Math.max(...migrations.map(m => m.version)) + 1;
        const description = process.argv.slice(3).join(' ') || 'New migration';
        
        const template = `
{
  version: ${newVersion},
  description: '${description}',
  up: async () => {
    // Migration logic here
  },
  down: async () => {
    // Rollback logic here
  },
},`;
        
        logger.info('Add this migration to the migrations array:');
        logger.info(template);
        break;

      default:
        logger.info('Usage:');
        logger.info('  npm run migrate up [version]     - Run migrations up to version (all if no version)');
        logger.info('  npm run migrate down <version>   - Rollback migrations to version');
        logger.info('  npm run migrate status           - Show migration status');
        logger.info('  npm run migrate create <desc>    - Generate migration template');
        break;
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    logger.info('Database connection closed');
    process.exit(0);
  }
}

if (require.main === module) {
  runCLI();
}

export { MigrationManager, migrations };