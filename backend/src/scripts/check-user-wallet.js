const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const { User } = require('../models/User.model');

async function checkUserWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
    console.log('Connected to MongoDB');
    const user = await User.findById('68bf13c1746dd185de2ee844').select('+encryptedPrivateKey');
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User wallet info:', {
      id: user._id.toString(),
      email: user.email,
      walletAddress: user.walletAddress,
      hasEncryptedKey: Boolean(user.encryptedPrivateKey),
      keyLength: user.encryptedPrivateKey ? user.encryptedPrivateKey.length : 0,
      keyPreview: user.encryptedPrivateKey ? user.encryptedPrivateKey.substring(0, 20) + '...' : null
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUserWallet();