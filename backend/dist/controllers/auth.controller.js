"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, phoneNumber, fullName, role } = req.body;
            const result = await authService.register({
                email,
                password,
                phoneNumber,
                fullName,
                role,
            });
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please verify your email.',
                user: {
                    id: result._id,
                    email: result.email,
                    fullName: result.fullName,
                    status: result.status,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json({
                success: true,
                message: 'Login successful',
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
                user: {
                    id: result.user._id,
                    email: result.user.email,
                    fullName: result.user.fullName,
                    role: result.user.role,
                    walletAddress: result.user.walletAddress,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const userId = req.user.id;
            await authService.logout(userId);
            res.json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Refresh token method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { phoneNumber, otp } = req.body;
            const result = await authService.verifyOTP(phoneNumber, otp);
            res.json({
                success: true,
                message: 'Phone number verified successfully',
                result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Forgot password method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Reset password method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Change password method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async enable2FA(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Enable 2FA method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async disable2FA(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Disable 2FA method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verify2FA(_req, res, next) {
        try {
            res.json({
                success: false,
                message: 'Verify 2FA method not implemented yet',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendOtp(req, res, next) {
        try {
            const { phoneNumber } = req.body;
            await authService.sendOTP(phoneNumber);
            res.json({
                success: true,
                message: 'OTP sent successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map