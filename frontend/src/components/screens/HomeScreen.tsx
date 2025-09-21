import React, { useState, useEffect } from "react";
import { Nfc, Eye, EyeOff, Zap, Loader2 } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { getUserProfileAPI, getUserCardsAPI, getWalletBalanceAPI } from "@/lib/api-client";
import { getWalletBalance } from "@/lib/sui-client";

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
    
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userCards, setUserCards] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const loadUserData = async () => {
            try {
                setLoading(true);
                setError("");

                // Load user profile
                const profileResponse = await getUserProfileAPI();
                if (profileResponse?.success && profileResponse?.data) {
                    setUserProfile(profileResponse.data);
                }

                // Load user cards
                const cardsResponse = await getUserCardsAPI();
                if (cardsResponse?.success && cardsResponse?.data) {
                    setUserCards(cardsResponse.data);
                }

                // Load wallet balance
                if (address) {
                    try {
                        const balanceData = await getWalletBalance(address);
                        setWalletBalance(balanceData.balance);
                    } catch (balanceError) {
                        console.warn('Failed to load wallet balance:', balanceError);
                        // Fallback to API if Sui client fails
                        try {
                            const apiBalanceResponse = await getWalletBalanceAPI(address);
                            if (apiBalanceResponse?.success && apiBalanceResponse?.data) {
                                setWalletBalance(apiBalanceResponse.data.balance || 0);
                            }
                        } catch (apiError) {
                            console.warn('API balance also failed:', apiError);
                        }
                    }
                }

            } catch (err: any) {
                console.error('Error loading user data:', err);
                setError(err?.response?.data?.error || "Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [address]);

    if (loading) {
        return (
            <div className="p-6 space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                        WALLET
                    </h1>
                    <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
                </div>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neo-pink" />
                        <p className="text-lg font-semibold text-neo-black">Loading wallet...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                                    ? `${walletBalance.toFixed(2)} SUI`
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
                    {(card || userCards.length > 0) && (
                        <div>STATUS: {(card?.blockedAt || userCards[0]?.blockedAt) ? 'BLOCKED' : (card?.isActive || userCards[0]?.isActive) ? 'ACTIVE' : 'INACTIVE'}</div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 font-mono text-sm">
                    {error}
                </div>
            )}

            {/* Card Preview + NFC Scan */}
            <div className="space-y-4">
                {(card || userCards.length > 0) && (
                    <div className="border-4 border-neo-black shadow-brutal bg-neo-white p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-xs font-bold text-neo-black">YOUR NFC CARD</p>
                            <span className={`font-mono text-xs ${
                                (card?.blockedAt || userCards[0]?.blockedAt) ? 'text-red-600' : 
                                (card?.isActive || userCards[0]?.isActive) ? 'text-neo-cyan' : 'text-neo-pink'
                            }`}>
                                {(card?.blockedAt || userCards[0]?.blockedAt) ? 'BLOCKED' : 
                                 (card?.isActive || userCards[0]?.isActive) ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className="font-mono text-sm">
                            <div>TYPE: <span className="font-bold">{(card?.cardType || userCards[0]?.cardType || '—')}</span></div>
                            <div>UUID: <span className="break-all">{(card?.cardUuid || userCards[0]?.cardUuid || card?.id || userCards[0]?.id || '—')}</span></div>
                            {typeof (card?.usageCount || userCards[0]?.usageCount) === 'number' && (
                                <div>USAGE: <span className="font-bold">{(card?.usageCount || userCards[0]?.usageCount)}</span></div>
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
                        ${(card?.dailyLimit || userCards[0]?.dailyLimit || userProfile?.dailyLimit || 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-4">
                    <p className="font-mono text-xs font-bold text-neo-black mb-1">
                        CARD STATUS
                    </p>
                    <p className="text-2xl font-mono font-bold text-neo-cyan">
                        {(card?.blockedAt || userCards[0]?.blockedAt) ? "BLOCKED" : 
                         (card?.isActive || userCards[0]?.isActive) ? "ACTIVE" : "INACTIVE"}
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
                                userProfile?.otpEnabled
                                    ? "text-neo-cyan"
                                    : "text-neo-pink"
                            }`}
                        >
                            {userProfile?.otpEnabled ? "YES" : "NO"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">2FA ENABLED</span>
                        <span
                            className={`font-mono text-xs font-bold ${
                                userProfile?.twoFactorEnabled
                                    ? "text-neo-cyan"
                                    : "text-neo-pink"
                            }`}
                        >
                            {userProfile?.twoFactorEnabled ? "YES" : "NO"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;