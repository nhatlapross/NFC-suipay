"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Card_model_1 = require("../models/Card.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function setupTestCard() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nfc-payment');
        console.log('Connected to MongoDB');
        const testCardUuid = '550e8400-e29b-41d4-a716-446655440000';
        // Check if card exists
        let card = await Card_model_1.Card.findOne({ cardUuid: testCardUuid });
        if (card) {
            console.log('Card already exists:', {
                id: card._id.toString(),
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
        }
        else {
            // Create test card
            card = await Card_model_1.Card.create({
                cardUuid: testCardUuid,
                userId: '68bf13c1746dd185de2ee844', // The test user
                cardType: 'virtual',
                isActive: true,
                dailyLimit: 100, // 100 SUI per day
                monthlyLimit: 1000, // 1000 SUI per month
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            });
            console.log('Test card created:', {
                id: card._id.toString(),
                cardUuid: card.cardUuid,
                isActive: card.isActive,
                dailyLimit: card.dailyLimit,
                monthlyLimit: card.monthlyLimit
            });
        }
    }
    catch (error) {
        console.error('Error setting up card:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
setupTestCard();
//# sourceMappingURL=setup-test-card.js.map