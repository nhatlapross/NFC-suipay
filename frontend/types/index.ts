export interface User {
    _id: string;
    email: string;
    phoneNumber: string;
    fullName: string;
    role?: "user" | "merchant" | "admin";
    dailyLimit: number;
    monthlyLimit: number;
    status: "active" | "blocked" | "suspended";
    kycStatus: "pending" | "verified" | "rejected";
    kycDocuments?: unknown;
    otpEnabled?: boolean;
    twoFactorEnabled?: boolean;
    loginAttempts: number;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
    lastLogin: Date;
    walletAddress: string;
    multiSigEnabled?: boolean;
}

export interface BaseCard {
    id: string;
    cardUuid: string;
    cardType: "virtual" | "physical";
    isActive: boolean;
    dailyLimit: number;
    monthlyLimit: number;
    dailySpent: number;
    monthlySpent: number;
    singleTransactionLimit: number;
    issueDate: Date;
    expiryDate: Date;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Card extends BaseCard {
    userId: string;
    isPrimary: boolean;
    blockedAt?: Date;
    blockedReason?: string;
}

export interface Transaction {
    id: string;
    txHash?: string;
    type: "payment" | "topup" | "withdraw" | "received" | "transfer";
    amount: number;
    currency?: string;
    description?: string;
    merchantName?: string;
    status: string;
    gasFee?: number;
    date: string;
    createdAt?: Date;
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
