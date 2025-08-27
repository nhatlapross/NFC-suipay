import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { generateRandomToken, generateOTP } from './encryption.service';
import { getRedisClient } from '../config/redis.config';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

export class AuthService {
  private get redisClient() {
    return getRedisClient();
  }

  async register(userData: {
    email: string;
    password: string;
    phoneNumber: string;
    fullName: string;
  }): Promise<IUser> {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }]
    });
    
    if (existingUser) {
      throw new Error('User already exists with this email or phone number');
    }
    
    // Create user
    const user = await User.create(userData);
    
    // Send verification email
    await this.sendVerificationEmail(user);
    
    return user;
  }

  async login(email: string, password: string): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user
    const user = await User.findOne({ email }).select('+refreshToken');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Account is locked. Please try again later.');
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= CONSTANTS.MAX_LOGIN_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }
      
      await user.save();
      throw new Error('Invalid credentials');
    }
    
    // Reset login attempts
    user.loginAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
    });
    
    // Clear any cached session
    await this.redisClient.del(`session:${userId}`);
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as any;
      
      const user = await User.findById(decoded.userId).select('+refreshToken');
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      
      user.refreshToken = newRefreshToken;
      await user.save();
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async sendOTP(phoneNumber: string): Promise<void> {
    const otp = generateOTP();
    
    // Store OTP in Redis
    await this.redisClient.setex(
      `otp:${phoneNumber}`,
      CONSTANTS.OTP_EXPIRY_MINUTES * 60,
      otp
    );
    
    // Send OTP via SMS
    // await smsService.sendOTP(phoneNumber, otp);
    
    logger.info(`OTP sent to ${phoneNumber}: ${otp}`); // Remove in production
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const storedOTP = await this.redisClient.get(`otp:${phoneNumber}`);
    
    if (!storedOTP || storedOTP !== otp) {
      return false;
    }
    
    // Delete OTP after successful verification
    await this.redisClient.del(`otp:${phoneNumber}`);
    
    return true;
  }

  private generateAccessToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      } as jwt.SignOptions
    );
  }

  private generateRefreshToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id,
        tokenVersion: generateRandomToken(16),
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      } as jwt.SignOptions
    );
  }

  private async sendVerificationEmail(user: IUser): Promise<void> {
    // Implement email verification logic
    logger.info(`Sending verification email to ${user.email}`);
  }
}