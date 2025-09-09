import mongoose from 'mongoose';
import { Card } from '../models/Card.model';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestCard() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('Connected to MongoDB');
    
    const testCardUuid = '550e8400-e29b-41d4-a716-446655440000';
    
    // Check if card exists
    let card = await Card.findOne({ cardUuid: testCardUuid });
    
    if (card) {
      console.log('Card already exists:', {
        id: (card as any)._id.toString(),
        cardUuid: card.cardUuid,
        isActive: card.isActive,
        userId: card.userId
      });
      
      // Activate it if not active
      if (!card.isActive) {
        card.isActive = true;
        await card.save();
        console.log('Card activated');
      }
    } else {
      // Create test card
      card = await Card.create({
        cardUuid: testCardUuid,
        userId: '68bf13c1746dd185de2ee844', // The test user
        cardType: 'virtual',
        isActive: true,
        dailyLimit: 100, // 100 SUI per day
        monthlyLimit: 1000, // 1000 SUI per month
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
      
      console.log('Test card created:', {
        id: (card as any)._id.toString(),
        cardUuid: card.cardUuid,
        isActive: card.isActive,
        dailyLimit: card.dailyLimit,
        monthlyLimit: card.monthlyLimit
      });
    }
    
  } catch (error) {
    console.error('Error setting up card:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupTestCard();