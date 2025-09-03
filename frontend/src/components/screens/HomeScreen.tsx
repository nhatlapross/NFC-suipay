import React from "react";
import { Nfc, Eye, EyeOff, Zap } from "lucide-react";
import { mockWalletData } from "@/data/mockData";

interface HomeScreenProps {
    showBalance: boolean;
    onToggleBalance: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    showBalance,
    onToggleBalance,
}) => {
    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    WALLET
                </h1>
                <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {/* Balance Card */}
            <div className="bg-neo-cyan border-4 border-neo-black shadow-brutal p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="font-mono text-sm font-bold text-neo-black mb-1">
                            CURRENT BALANCE
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-mono font-bold text-neo-black">
                                {showBalance
                                    ? `$${mockWalletData.balance.toFixed(2)}`
                                    : "••••••"}
                            </span>
                            <button
                                onClick={onToggleBalance}
                                className="p-2 bg-neo-white border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                            >
                                {showBalance ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="bg-neo-pink p-3 border-2 border-neo-black">
                        <Zap size={24} className="text-neo-white" />
                    </div>
                </div>

                <div className="bg-neo-black text-neo-white p-3 font-mono text-xs">
                    ACCOUNT: ****1234 | STATUS: ACTIVE
                </div>
            </div>

            {/* NFC Scan Button */}
            <div className="text-center">
                <button className="bg-neo-pink text-neo-white border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow px-8 py-6 font-mono font-bold text-lg">
                    <div className="flex flex-col items-center gap-3">
                        <Nfc size={48} />
                        <span>TAP TO SCAN NFC</span>
                    </div>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-4">
                    <p className="font-mono text-xs font-bold text-neo-black mb-1">
                        DAILY LIMIT
                    </p>
                    <p className="text-2xl font-mono font-bold text-neo-pink">
                        ${mockWalletData.dailyLimit}
                    </p>
                </div>
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-4">
                    <p className="font-mono text-xs font-bold text-neo-black mb-1">
                        CARD STATUS
                    </p>
                    <p className="text-2xl font-mono font-bold text-neo-cyan">
                        {mockWalletData.cardLocked ? "LOCKED" : "ACTIVE"}
                    </p>
                </div>
            </div>

            {/* Security Status */}
            <div className="bg-neo-black text-neo-white border-4 border-neo-black p-4">
                <h3 className="font-mono font-bold text-sm mb-3">
                    SECURITY STATUS
                </h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">OTP ENABLED</span>
                        <span
                            className={`font-mono text-xs font-bold ${
                                mockWalletData.otpEnabled
                                    ? "text-neo-cyan"
                                    : "text-neo-pink"
                            }`}
                        >
                            {mockWalletData.otpEnabled ? "YES" : "NO"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">2FA ENABLED</span>
                        <span
                            className={`font-mono text-xs font-bold ${
                                mockWalletData.twoFactorEnabled
                                    ? "text-neo-cyan"
                                    : "text-neo-pink"
                            }`}
                        >
                            {mockWalletData.twoFactorEnabled ? "YES" : "NO"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
