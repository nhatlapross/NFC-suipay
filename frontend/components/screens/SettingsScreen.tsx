"use client";

import { useEffect, useState } from "react";
import {
    Lock,
    Unlock,
    DollarSign,
    Shield,
    Smartphone,
    CreditCard,
} from "lucide-react";
import {
    getUserSettingsAPI,
    updateUserSettingsAPI,
    getUserLimitsAPI,
    updateUserLimitsAPI,
    getUserCardsAPI,
    blockCardAPI,
    unblockCardAPI,
} from "@/lib/api-client";
import { Card } from "@/types";
import { AxiosError } from "axios";

const SettingsScreen: React.FC = () => {
    const [cardLocked, setCardLocked] = useState(false);
    const [dailyLimit, setDailyLimit] = useState(0);
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [monthlyLimit, setMonthlyLimit] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [userCards, setUserCards] = useState<Card[]>([]);
    const [blockingCard, setBlockingCard] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            setError("");
            try {
                const resp = await getUserSettingsAPI();
                if (resp.success && resp.settings) {
                    setTwoFactorEnabled(!!resp.settings.twoFactorAuth);
                    setDailyLimit(resp.settings.dailyLimit ?? 0);
                    setMonthlyLimit(resp.settings.monthlyLimit ?? 0);
                } else {
                    setError("Failed to load settings");
                }
                // Also load limits explicitly to be safe
                try {
                    const limits = await getUserLimitsAPI();
                    if (limits.success && limits.limits) {
                        setDailyLimit(limits.limits.dailyLimit ?? 0);
                        setMonthlyLimit(limits.limits.monthlyLimit ?? 0);
                    }
                } catch {}

                // Load user cards
                try {
                    console.log("🔄 [SettingsScreen] Loading user cards...");
                    const cards = await getUserCardsAPI();
                    console.log("📋 [SettingsScreen] Cards response:", cards);

                    if (cards.success && cards.data.cards) {
                        setUserCards(cards.data.cards);
                        console.log(
                            "✅ [SettingsScreen] Cards loaded successfully:",
                            cards.data.cards
                        );
                        // Set card locked state based on first card's blocked status
                        if (cards.data.cards.length > 0) {
                            const firstCard = cards.data.cards[0];
                            const isBlocked =
                                !!firstCard.blockedAt || !firstCard.isActive;
                            setCardLocked(isBlocked);
                            console.log("🔒 [SettingsScreen] Card status:", {
                                cardId: firstCard.id || firstCard.cardUuid,
                                isActive: firstCard.isActive,
                                blockedAt: firstCard.blockedAt,
                                isBlocked,
                            });
                        }
                    } else {
                        console.log(
                            "❌ [SettingsScreen] No cards found or invalid response:",
                            cards
                        );
                    }
                } catch (err) {
                    console.log(
                        "💥 [SettingsScreen] Error loading cards:",
                        err
                    );
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load settings");
                }
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleDailyLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setDailyLimit(value);
    };

    const handleMonthlyLimitChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = parseInt(e.target.value) || 0;
        setMonthlyLimit(value);
    };

    const saveLimits = async () => {
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const resp = await updateUserLimitsAPI({
                dailyLimit,
                monthlyLimit,
            });
            if (resp.success && resp.limits) {
                setDailyLimit(resp.limits.dailyLimit ?? dailyLimit);
                setMonthlyLimit(resp.limits.monthlyLimit ?? monthlyLimit);
                setMessage("Spending limits updated");
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update limits");
            }
        } finally {
            setSaving(false);
        }
    };

    const toggleTwoFactor = async () => {
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const resp = await updateUserSettingsAPI({
                twoFactorAuth: !twoFactorEnabled,
            });
            if (resp.success && resp.settings) {
                setTwoFactorEnabled(!!resp.settings.twoFactorAuth);
                setMessage("Security settings updated");
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update settings");
            }
        } finally {
            setSaving(false);
        }
    };

    const toggleCardBlock = async () => {
        console.log("🚀 [SettingsScreen] toggleCardBlock function called");
        console.log("📊 [SettingsScreen] Current state:", {
            userCardsLength: userCards.length,
            cardLocked,
            blockingCard,
            userCards: userCards,
        });

        if (userCards.length === 0) {
            console.log("❌ [SettingsScreen] No cards found to block/unblock");
            setError("No cards found to block/unblock");
            return;
        }

        const card = userCards[0]; // Use first card
        console.log("🔄 [SettingsScreen] Toggle card block:", {
            cardId: card.id || card.cardUuid,
            currentStatus: cardLocked ? "BLOCKED" : "ACTIVE",
            action: cardLocked ? "UNBLOCK" : "BLOCK",
            timestamp: new Date().toISOString(),
        });

        setBlockingCard(true);
        setError("");
        setMessage("");

        try {
            if (cardLocked) {
                // Unblock card
                console.log("🔓 [SettingsScreen] Unblocking card...", {
                    cardId: card.id || card.cardUuid,
                });
                const resp = await unblockCardAPI(card.cardUuid);
                console.log("🔓 [SettingsScreen] Unblock response:", resp);

                if (resp.success) {
                    setCardLocked(false);
                    setMessage("Card unblocked successfully");
                    console.log(
                        "✅ [SettingsScreen] Card unblocked successfully"
                    );

                    // Refresh cards
                    console.log(
                        "🔄 [SettingsScreen] Refreshing cards after unblock..."
                    );
                    const cards = await getUserCardsAPI();
                    if (cards.success && cards.data.cards) {
                        console.log(
                            "📋 [SettingsScreen] Cards refreshed:",
                            cards.data.cards
                        );
                        setUserCards(cards.data.cards);
                    }

                    // Dispatch event to notify other components
                    window.dispatchEvent(new CustomEvent("cardUnblocked"));
                } else {
                    console.log("❌ [SettingsScreen] Unblock failed:", resp);
                }
            } else {
                // Block card
                console.log("🔒 [SettingsScreen] Blocking card...", {
                    cardId: card.id || card.cardUuid,
                });
                const resp = await blockCardAPI(
                    card.cardUuid,
                    "User requested block"
                );
                console.log("🔒 [SettingsScreen] Block response:", resp);

                if (resp.success) {
                    setCardLocked(true);
                    setMessage("Card blocked successfully");
                    console.log(
                        "✅ [SettingsScreen] Card blocked successfully"
                    );

                    // Refresh cards
                    console.log(
                        "🔄 [SettingsScreen] Refreshing cards after block..."
                    );
                    const cards = await getUserCardsAPI();
                    if (cards.success && cards.data.cards) {
                        console.log(
                            "📋 [SettingsScreen] Cards refreshed:",
                            cards.data.cards
                        );
                        setUserCards(cards.data.cards);
                    }

                    // Dispatch event to notify other components
                    window.dispatchEvent(new CustomEvent("cardBlocked"));
                } else {
                    console.log("❌ [SettingsScreen] Block failed:", resp);
                }
            }
        } catch (err) {
            console.log("💥 [SettingsScreen] Toggle card block error:", err);
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update card status");
            }
        } finally {
            setBlockingCard(false);
            console.log("🏁 [SettingsScreen] Toggle card block completed");
        }
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

            {loading && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono">Đang tải cài đặt...</p>
                </div>
            )}
            {error && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono text-red-600">{error}</p>
                </div>
            )}
            {message && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono text-green-700">{message}</p>
                </div>
            )}

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
                            Block or unblock your card instantly
                        </p>
                    </div>
                </div>

                {userCards.length > 0 && (
                    <div className="mb-4 p-3 bg-neo-cyan border-2 border-neo-black">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={16} className="text-neo-black" />
                            <span className="font-mono font-bold text-sm text-neo-black">
                                CARD: {userCards[0].cardUuid || userCards[0].id}
                            </span>
                        </div>
                        <div className="font-mono text-xs text-neo-black opacity-70">
                            Status: {cardLocked ? "BLOCKED" : "ACTIVE"}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        console.log("🖱️ [SettingsScreen] Button clicked:", {
                            userCardsLength: userCards.length,
                            cardLocked,
                            blockingCard,
                            disabled: blockingCard || userCards.length === 0,
                        });
                        console.log(
                            "🖱️ [SettingsScreen] Button is disabled?",
                            blockingCard || userCards.length === 0
                        );
                        if (!(blockingCard || userCards.length === 0)) {
                            toggleCardBlock();
                        } else {
                            console.log(
                                "❌ [SettingsScreen] Button is disabled, not calling toggleCardBlock"
                            );
                        }
                    }}
                    disabled={blockingCard || userCards.length === 0}
                    className={`w-full py-4 font-mono font-bold text-lg border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow ${
                        blockingCard
                            ? "bg-gray-300 text-gray-600"
                            : cardLocked
                            ? "bg-neo-cyan text-neo-black"
                            : "bg-neo-pink text-neo-white"
                    }`}
                >
                    {blockingCard
                        ? "PROCESSING..."
                        : cardLocked
                        ? "UNBLOCK CARD"
                        : "BLOCK CARD"}
                </button>
            </div>

            {/* Daily Spending Limit (read-only from settings for now) */}
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
                            onChange={handleDailyLimitChange}
                            className="flex-1 p-3 pl-5 border-4 border-neo-black font-mono font-bold text-lg bg-neo-white focus:outline-none focus:shadow-brutal"
                            min="0"
                            max="10000"
                            step="50"
                            disabled={saving}
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
                                disabled={saving}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Limit */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-neo-cyan p-3 border-2 border-neo-black">
                        <DollarSign size={24} className="text-neo-black" />
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            MONTHLY LIMIT
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Set your monthly spending limit
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
                            value={monthlyLimit}
                            onChange={handleMonthlyLimitChange}
                            className="flex-1 p-3 pl-5 border-4 border-neo-black font-mono font-bold text-lg bg-neo-white focus:outline-none focus:shadow-brutal"
                            min="0"
                            max="10000"
                            step="50"
                            disabled={saving}
                        />
                    </div>

                    <div className="flex gap-2">
                        {[500, 1000, 2000, 5000].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setMonthlyLimit(amount)}
                                className={`flex-1 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                    monthlyLimit === amount
                                        ? "bg-neo-black text-neo-white"
                                        : "bg-neo-white text-neo-black hover:bg-neo-cyan"
                                }`}
                                disabled={saving}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save Limits Action */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <button
                    onClick={saveLimits}
                    disabled={saving}
                    className={`w-full py-4 font-mono font-bold text-lg border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow ${
                        saving
                            ? "bg-gray-300 text-gray-600"
                            : "bg-neo-black text-neo-white"
                    }`}
                >
                    {saving ? "SAVING..." : "SAVE LIMITS"}
                </button>
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
                    {/* OTP Toggle (local-only) */}
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

                    {/* 2FA Toggle (persisted) */}
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
                            onClick={toggleTwoFactor}
                            disabled={saving}
                            className={`px-4 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                twoFactorEnabled
                                    ? "bg-neo-cyan text-neo-black"
                                    : "bg-neo-white text-neo-black hover:bg-neo-pink hover:text-neo-white"
                            }`}
                        >
                            {twoFactorEnabled
                                ? saving
                                    ? "SAVING..."
                                    : "ON"
                                : saving
                                ? "SAVING..."
                                : "OFF"}
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
