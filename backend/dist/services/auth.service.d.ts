import { IUser } from '../models/User.model';
export declare class AuthService {
    private get redis();
    register(userData: {
        email: string;
        password: string;
        phoneNumber: string;
        fullName: string;
        role?: 'user' | 'merchant' | 'admin';
    }): Promise<IUser>;
    login(email: string, password: string): Promise<{
        user: IUser;
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    sendOTP(phoneNumber: string): Promise<void>;
    verifyOTP(phoneNumber: string, otp: string): Promise<boolean>;
    private generateAccessToken;
    private generateRefreshToken;
    private sendVerificationEmail;
}
//# sourceMappingURL=auth.service.d.ts.map