const mongoose = require('mongoose');
require('dotenv').config();

async function checkCard() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('Connected to MongoDB');
    
    // Import Card model
    const Card = require('../models/Card.model').Card;
    
    const card = await Card.findOne({ cardUuid: '550e8400-e29b-41d4-a716-446655440000' });
    
    if (card) {
      console.log('Card found:', {
        id: card._id.toString(),
        cardUuid: card.cardUuid,
        isActive: card.isActive,
        dailyLimit: card.dailyLimit,
        monthlyLimit: card.monthlyLimit,
        lastUsed: card.lastUsed
      });
    } else {
      console.log('Card not found with UUID: 550e8400-e29b-41d4-a716-446655440000');
      
      // List all cards
      const allCards = await Card.find({});
      console.log('Total cards in database:', allCards.length);
      if (allCards.length > 0) {
        console.log('Available cards:', allCards.map(c => ({
          uuid: c.cardUuid,
          active: c.isActive
        })));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkCard();