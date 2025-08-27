export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  walletAddress: string;
  dailyLimit: number;
  monthlyLimit: number;
  status: 'active' | 'blocked' | 'suspended';
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  lastActivity: Date;
}

export interface Card {
  id: string;
  cardUuid: string;
  userId: string;
  cardType: 'standard' | 'premium' | 'corporate';
  isActive: boolean;
  issueDate: Date;
  expiryDate: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface Transaction {
  id: string;
  txHash: string;
  type: 'payment' | 'topup' | 'withdraw';
  amount: number;
  currency: string;
  merchantName?: string;
  status: 'pending' | 'completed' | 'failed';
  gasFee: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface Wallet {
  address: string;
  balance: number;
  tokens: Token[];
}

export interface Token {
  symbol: string;
  name: string;
  balance: number;
  icon?: string;
}

export interface NFCData {
  uuid: string;
  timestamp: string;
  records?: any[];
}

export interface PaymentRequest {
  cardUuid: string;
  amount: number;
  merchantId: string;
  currency?: string;
}

export interface PaymentResponse {
  success: boolean;
  txHash?: string;
  amount?: number;
  timestamp?: Date;
  error?: string;
}