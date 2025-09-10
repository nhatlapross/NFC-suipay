"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("../models/User.model");
const encryption_service_1 = require("./encryption.service");
const redis_config_1 = require("../config/redis.config");
const constants_1 = require("../config/constants");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    get redis() {
        return redis_config_1.redisClient;
    }
    async register(userData) {
        // Check if user exists
        const existingUser = await User_model_1.User.findOne({
            $or: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }]
        });
        if (existingUser) {
            throw new Error('User already exists with this email or phone number');
        }
        // Create user
        const user = await User_model_1.User.create(userData);
        // Send verification email
        await this.sendVerificationEmail(user);
        return user;
    }
    async login(email, password) {
        // Find user
        const user = await User_model_1.User.findOne({ email }).select('+refreshToken');
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
            if (user.loginAttempts >= constants_1.CONSTANTS.MAX_LOGIN_ATTEMPTS) {
                user.lockoutUntil = new Date(Date.now() + constants_1.CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000);
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
    async logout(userId) {
        await User_model_1.User.findByIdAndUpdate(userId, {
            refreshToken: null,
        });
        // Clear any cached session
        await this.redis.del(`session:${userId}`);
    }
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User_model_1.User.findById(decoded.userId).select('+refreshToken');
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
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    async sendOTP(phoneNumber) {
        const otp = (0, encryption_service_1.generateOTP)();
        // Store OTP in Redis
        await this.redis.setEx(`otp:${phoneNumber}`, constants_1.CONSTANTS.OTP_EXPIRY_MINUTES * 60, otp);
        // Send OTP via SMS
        // await smsService.sendOTP(phoneNumber, otp);
        logger_1.default.info(`OTP sent to ${phoneNumber}: ${otp}`); // Remove in production
    }
    async verifyOTP(phoneNumber, otp) {
        const storedOTP = await this.redis.get(`otp:${phoneNumber}`);
        if (!storedOTP || storedOTP !== otp) {
            return false;
        }
        // Delete OTP after successful verification
        await this.redis.del(`otp:${phoneNumber}`);
        return true;
    }
    generateAccessToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user._id,
            email: user.email,
            role: user.role,
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        });
    }
    generateRefreshToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user._id,
            tokenVersion: (0, encryption_service_1.generateRandomToken)(16),
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        });
    }
    async sendVerificationEmail(user) {
        // Implement email verification logic
        logger_1.default.info(`Sending verification email to ${user.email}`);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map