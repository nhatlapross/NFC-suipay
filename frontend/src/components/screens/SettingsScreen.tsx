import React, { useState } from "react";
import { Lock, Unlock, DollarSign, Shield, Smartphone } from "lucide-react";
import { mockWalletData } from "@/data/mockData";

const SettingsScreen: React.FC = () => {
    const [cardLocked, setCardLocked] = useState(mockWalletData.cardLocked);
    const [dailyLimit, setDailyLimit] = useState(mockWalletData.dailyLimit);
    const [otpEnabled, setOtpEnabled] = useState(mockWalletData.otpEnabled);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        mockWalletData.twoFactorEnabled
    );

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setDailyLimit(value);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    SETTINGS
                </h1>
                <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {/* Card Control */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-neo-pink p-3 border-2 border-neo-black">
                        {cardLocked ? (
                            <Lock size={24} className="text-neo-white" />
                        ) : (
                            <Unlock size={24} className="text-neo-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            CARD CONTROL
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Lock or unlock your card instantly
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setCardLocked(!cardLocked)}
                    className={`w-full py-4 font-mono font-bold text-lg border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow ${
                        cardLocked
                            ? "bg-neo-cyan text-neo-black"
                            : "bg-neo-pink text-neo-white"
                    }`}
                >
                    {cardLocked ? "UNLOCK CARD" : "LOCK CARD"}
                </button>
            </div>

            {/* Daily Spending Limit */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-neo-cyan p-3 border-2 border-neo-black">
                        <DollarSign size={24} className="text-neo-black" />
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            DAILY LIMIT
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Set your daily spending limit
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative flex items-center gap-4">
                        <span className="absolute left-2.5 font-mono text-lg font-bold text-neo-black">
                            $
                        </span>
                        <input
                            type="number"
                            value={dailyLimit}
                            onChange={handleLimitChange}
                            className="flex-1 p-3 pl-5 border-4 border-neo-black font-mono font-bold text-lg bg-neo-white focus:outline-none focus:shadow-brutal"
                            min="0"
                            max="10000"
                            step="50"
                        />
                    </div>

                    <div className="flex gap-2">
                        {[500, 1000, 2000, 5000].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setDailyLimit(amount)}
                                className={`flex-1 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                    dailyLimit === amount
                                        ? "bg-neo-black text-neo-white"
                                        : "bg-neo-white text-neo-black hover:bg-neo-cyan"
                                }`}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neo-black p-3 border-2 border-neo-black">
                        <Shield size={24} className="text-neo-white" />
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            SECURITY
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Manage your security preferences
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* OTP Toggle */}
                    <div className="flex items-center justify-between p-4 border-2 border-neo-black">
                        <div className="flex items-center gap-3">
                            <Smartphone size={20} className="text-neo-black" />
                            <div>
                                <p className="font-mono font-bold text-sm text-neo-black">
                                    OTP VERIFICATION
                                </p>
                                <p className="font-mono text-xs text-neo-black opacity-70">
                                    SMS one-time passwords
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOtpEnabled(!otpEnabled)}
                            className={`px-4 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                otpEnabled
                                    ? "bg-neo-cyan text-neo-black"
                                    : "bg-neo-white text-neo-black hover:bg-neo-pink hover:text-neo-white"
                            }`}
                        >
                            {otpEnabled ? "ON" : "OFF"}
                        </button>
                    </div>

                    {/* 2FA Toggle */}
                    <div className="flex items-center justify-between p-4 border-2 border-neo-black">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-neo-black" />
                            <div>
                                <p className="font-mono font-bold text-sm text-neo-black">
                                    TWO-FACTOR AUTH
                                </p>
                                <p className="font-mono text-xs text-neo-black opacity-70">
                                    App-based authentication
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                setTwoFactorEnabled(!twoFactorEnabled)
                            }
                            className={`px-4 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                twoFactorEnabled
                                    ? "bg-neo-cyan text-neo-black"
                                    : "bg-neo-white text-neo-black hover:bg-neo-pink hover:text-neo-white"
                            }`}
                        >
                            {twoFactorEnabled ? "ON" : "OFF"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Emergency Actions */}
            <div className="bg-neo-pink border-4 border-neo-black shadow-brutal p-6">
                <h3 className="font-mono font-bold text-lg text-neo-white mb-4">
                    EMERGENCY ACTIONS
                </h3>
                <div className="space-y-3">
                    <button className="w-full py-3 bg-neo-white text-neo-black border-2 border-neo-black font-mono font-bold hover:bg-neo-black hover:text-neo-white transition-colors">
                        FREEZE ALL TRANSACTIONS
                    </button>
                    <button className="w-full py-3 bg-neo-white text-neo-black border-2 border-neo-black font-mono font-bold hover:bg-neo-black hover:text-neo-white transition-colors">
                        REPORT CARD STOLEN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
