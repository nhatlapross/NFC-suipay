import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    password: string;
    phoneNumber: string;
    fullName: string;
    walletAddress?: string;
    encryptedPrivateKey?: string;
    role: 'user' | 'merchant' | 'admin';
    dailyLimit: number;
    monthlyLimit: number;
    status: 'active' | 'blocked' | 'suspended';
    kycStatus: 'pending' | 'verified' | 'rejected';
    kycDocuments?: string[];
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    pinHash?: string;
    lastLogin?: Date;
    loginAttempts: number;
    lockoutUntil?: Date;
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
    isLocked: boolean;
    comparePassword(password: string): Promise<boolean>;
    comparePin?(pin: string): Promise<boolean>;
    setPin?(pin: string): Promise<void>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.model.d.ts.map