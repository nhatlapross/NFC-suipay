import React from "react";
import { Nfc, Eye, EyeOff, Zap } from "lucide-react";
import { mockWalletData } from "@/data/mockData";
import { useWalletContext } from "@/contexts/WalletContext";

interface HomeScreenProps {
    showBalance: boolean;
    onToggleBalance: () => void;
    card?: any | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    showBalance,
    onToggleBalance,
    card,
}) => {
    const { wallet } = useWalletContext();
    const address = wallet?.address;
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
                <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col gap-1">
                        <p className="font-mono text-sm font-bold text-neo-black">
                            CURRENT BALANCE
                        </p>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-4xl font-mono font-bold text-neo-black">
                                {showBalance
                                    ? `$${mockWalletData.balance.toFixed(2)}`
                                    : "••••••"}
                            </span>
                            <button
                                onClick={onToggleBalance}
                                className="p-2 self-end bg-neo-white border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                            >
                                {showBalance ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="bg-neo-pink p-1 border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow">
                        <Zap size={24} className="text-neo-white" />
                    </div>
                </div>

                <div className="bg-neo-black text-neo-white p-3 font-mono text-xs">
                    <div>ADDRESS: <span className="break-all">{address || '—'}</span></div>
                    {card && (
                        <div>STATUS: {card.isActive ? 'ACTIVE' : 'INACTIVE'}</div>
                    )}
                </div>
            </div>

            {/* Card Preview + NFC Scan */}
            <div className="space-y-4">
                {card && (
                    <div className="border-4 border-neo-black shadow-brutal bg-neo-white p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-xs font-bold text-neo-black">YOUR NFC CARD</p>
                            <span className={`font-mono text-xs ${card.isActive ? 'text-neo-cyan' : 'text-neo-pink'}`}>{card.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                        <div className="font-mono text-sm">
                            <div>TYPE: <span className="font-bold">{card.cardType || '—'}</span></div>
                            <div>UUID: <span className="break-all">{(card.cardUuid || card.id || '—')}</span></div>
                            {typeof card.usageCount === 'number' && (
                                <div>USAGE: <span className="font-bold">{card.usageCount}</span></div>
                            )}
                        </div>
                    </div>
                )}
                <div className="text-center">
                    <button className="bg-neo-pink text-neo-white border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow px-8 py-6 font-mono font-bold text-lg">
                        <div className="flex flex-col items-center gap-3">
                            <Nfc size={48} />
                            <span>TAP TO SCAN NFC</span>
                        </div>
                    </button>
                </div>
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
