"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSuiClient = initSuiClient;
exports.getSuiClient = getSuiClient;
exports.getAdminKeypair = getAdminKeypair;
const client_1 = require("@mysten/sui/client");
const ed25519_1 = require("@mysten/sui/keypairs/ed25519");
const logger_1 = __importDefault(require("../utils/logger"));
let suiClient;
let adminKeypair;
async function initSuiClient() {
    try {
        const network = process.env.SUI_NETWORK || 'testnet';
        const rpcUrl = process.env.SUI_RPC_URL || (0, client_1.getFullnodeUrl)(network);
        suiClient = new client_1.SuiClient({ url: rpcUrl });
        // Initialize admin keypair from private key
        if (process.env.SUI_ADMIN_PRIVATE_KEY) {
            // Handle both base64 and bech32 (suiprivkey1...) formats
            const privateKeyString = process.env.SUI_ADMIN_PRIVATE_KEY;
            if (privateKeyString.startsWith('suiprivkey1')) {
                // Bech32 format - use Ed25519Keypair.fromSecretKey with the string directly
                adminKeypair = ed25519_1.Ed25519Keypair.fromSecretKey(privateKeyString);
            }
            else {
                // Base64 format - decode to bytes first
                const privateKeyBytes = Buffer.from(privateKeyString, 'base64');
                adminKeypair = ed25519_1.Ed25519Keypair.fromSecretKey(privateKeyBytes);
            }
        }
        // Test connection
        const checkpoint = await suiClient.getLatestCheckpointSequenceNumber();
        logger_1.default.info(`Connected to Sui ${network} at checkpoint ${checkpoint}`);
    }
    catch (error) {
        logger_1.default.error('Failed to initialize Sui client:', error);
        throw error;
    }
}
function getSuiClient() {
    if (!suiClient) {
        throw new Error('Sui client not initialized');
    }
    return suiClient;
}
function getAdminKeypair() {
    if (!adminKeypair) {
        throw new Error('Admin keypair not initialized');
    }
    return adminKeypair;
}
//# sourceMappingURL=sui.config.js.map