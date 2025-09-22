"use client";
import { useState, useEffect } from "react";
import {
    Lock,
    Unlock,
    RotateCcw,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Loader2,
} from "lucide-react";
import {
    getAllCardsAPI,
    blockCardAPI,
    unblockCardAPI,
    AdminCard,
} from "@/lib/api-client";
import { AxiosError } from "axios";
import { BaseCard } from "@/types";

interface User {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
}

interface Card extends BaseCard {
    blockedAt?: Date;
    blockedReason?: string;
    lastUsed?: Date;
    user?: User;
}

const WalletManagement: React.FC = () => {
    const [cards, setCards] = useState<AdminCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Load cards from API
    useEffect(() => {
        const loadCards = async () => {
            try {
                setLoading(true);
                setError("");
                console.log("🔄 [WalletManagement] Loading cards...");
                console.log("🔗 [WalletManagement] Calling getAllCardsAPI...");

                const response = await getAllCardsAPI();
                console.log("📋 [WalletManagement] Cards response:", response);
                console.log(
                    "🌐 [WalletManagement] API URL should be: /api/card/admin/all"
                );

                if (response.success && response.data.cards) {
                    setCards(response.data.cards);
                    console.log(
                        "✅ [WalletManagement] Cards loaded successfully:",
                        response.data.cards
                    );
                } else {
                    console.log(
                        "❌ [WalletManagement] No cards found or invalid response:",
                        response
                    );
                    setCards([]);
                }
            } catch (err) {
                console.error(
                    "💥 [WalletManagement] Error loading cards:",
                    err
                );
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load cards");
                }

                setCards([]);
            } finally {
                setLoading(false);
            }
        };

        loadCards();
    }, []);

    const toggleCardStatus = async (cardId: string) => {
        try {
            setActionLoading(cardId);
            console.log("🔒 [WalletManagement] Toggling card status:", cardId);

            const card = cards.find(
                (c) => c.id === cardId || c.cardUuid === cardId
            );
            if (!card) {
                console.log("❌ [WalletManagement] Card not found:", cardId);
                return;
            }

            let response;
            if (card.blockedAt || !card.isActive) {
                // Unblock card
                console.log("🔓 [WalletManagement] Unblocking card:", cardId);
                response = await unblockCardAPI(cardId);
            } else {
                // Block card
                console.log("🔒 [WalletManagement] Blocking card:", cardId);
                response = await blockCardAPI(
                    cardId,
                    "Admin blocked via wallet management"
                );
            }

            if (response?.success) {
                console.log(
                    "✅ [WalletManagement] Card status updated successfully"
                );
                // Refresh cards
                const refreshResponse = await getAllCardsAPI();
                if (refreshResponse?.success && refreshResponse?.data?.cards) {
                    setCards(refreshResponse.data.cards);
                }
            } else {
                console.log(
                    "❌ [WalletManagement] Failed to update card status:",
                    response
                );
                setError("Failed to update card status");
            }
        } catch (err) {
            console.error(
                "💥 [WalletManagement] Error toggling card status:",
                err
            );
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update card status");
            }
        } finally {
            setActionLoading(null);
        }
    };

    const resetKey = (cardId: string) => {
        // Mock key reset functionality
        alert(`Key reset initiated for ${cardId}`);
    };

    const getCardStatus = (card: Card) => {
        if (card.blockedAt) return "BLOCKED";
        if (!card.isActive) return "INACTIVE";
        return "ACTIVE";
    };

    const getStatusColor = (card: Card) => {
        const status = getCardStatus(card);
        switch (status) {
            case "ACTIVE":
                return "bg-[#00F0FF] text-black";
            case "BLOCKED":
                return "bg-[#FF005C] text-white";
            case "INACTIVE":
                return "bg-black text-white";
            default:
                return "bg-gray-400 text-black";
        }
    };

    const getStatusIcon = (card: Card) => {
        const status = getCardStatus(card);
        switch (status) {
            case "ACTIVE":
                return <CheckCircle className="w-4 h-4" />;
            case "BLOCKED":
                return <Lock className="w-4 h-4" />;
            case "INACTIVE":
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatDate = (date: Date | string) => {
        if (!date) return "Never";
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 60) return `${diffMins} MIN AGO`;
        if (diffHours < 24) return `${diffHours} HR AGO`;
        return d.toLocaleDateString();
    };

    const formatAmount = (amount: number | undefined) => {
        if (!amount && amount !== 0) return "$0.00";
        return `$${amount.toFixed(2)}`;
    };

    // Calculate stats from real data
    const activeCards = cards.filter(
        (card) => getCardStatus(card) === "ACTIVE"
    ).length;
    const blockedCards = cards.filter(
        (card) => getCardStatus(card) === "BLOCKED"
    ).length;
    const inactiveCards = cards.filter(
        (card) => getCardStatus(card) === "INACTIVE"
    ).length;
    const totalBalance = cards.reduce(
        (sum, card) => sum + (card.monthlyLimit - card.monthlySpent),
        0
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF005C]" />
                    <p className="text-lg font-semibold text-black">
                        Loading cards...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full">
            <div className="border-4 border-black bg-[#FF005C] p-4 lg:p-6 shadow-[8px_8px_0_black]">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    WALLET MANAGEMENT
                </h1>
                <p className="text-white font-medium text-sm lg:text-base">
                    CARD CONTROL & MONITORING
                </p>
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-semibold">
                        {error}
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 text-right">
                <div className="bg-[#00F0FF] p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-black">
                        {activeCards}
                    </div>
                    <div className="font-bold text-sm text-black">
                        ACTIVE CARDS
                    </div>
                </div>
                <div className="bg-[#FF005C] p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-white">
                        {blockedCards}
                    </div>
                    <div className="font-semibold text-sm text-white">
                        BLOCKED CARDS
                    </div>
                </div>
                <div className="bg-black p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-white">
                        {inactiveCards}
                    </div>
                    <div className="font-semibold text-sm text-white">
                        INACTIVE
                    </div>
                </div>
                <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-black">
                        {formatAmount(totalBalance)}
                    </div>
                    <div className="font-semibold text-sm text-black">
                        TOTAL BALANCE
                    </div>
                </div>
            </div>

            {/* Cards List */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-semibold mb-6 text-black">
                    CARD MANAGEMENT ({cards.length} cards)
                </h2>

                {cards.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-600">
                            No cards found
                        </p>
                        <p className="text-sm text-gray-500">
                            Create a card to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cards.map((card) => {
                            const status = getCardStatus(card);
                            const isActionLoading =
                                actionLoading === card.id ||
                                actionLoading === card.cardUuid;

                            return (
                                <div
                                    key={card.id}
                                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:p-6 border-2 border-black bg-white gap-4 lg:gap-0"
                                >
                                    <div className="flex items-center gap-4 lg:gap-6">
                                        <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-black flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-black text-sm lg:text-lg truncate">
                                                {card.cardUuid}
                                            </div>
                                            <div className="text-xs lg:text-sm text-gray-600 font-medium">
                                                {card.cardType.toUpperCase()} •{" "}
                                                {card.usageCount} uses
                                            </div>
                                            {card.user && (
                                                <div className="text-xs text-blue-600 font-medium">
                                                    👤 {card.user.fullName} (
                                                    {card.user.email})
                                                </div>
                                            )}
                                            {card.blockedReason && (
                                                <div className="text-xs text-red-600 font-medium">
                                                    Reason: {card.blockedReason}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-bold text-black">
                                            {formatAmount(
                                                card.monthlyLimit -
                                                    card.monthlySpent
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            of {formatAmount(card.monthlyLimit)}
                                        </div>
                                    </div>

                                    <div
                                        className={`px-3 py-2 border-2 border-black font-bold text-sm flex items-center gap-2 ${getStatusColor(
                                            card
                                        )}`}
                                    >
                                        {getStatusIcon(card)}
                                        {status}
                                    </div>

                                    <div className="text-sm font-bold text-gray-600">
                                        {formatDate(
                                            card.lastUsed || new Date()
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                toggleCardStatus(card.id)
                                            }
                                            disabled={isActionLoading}
                                            className={`p-3 border-2 border-black font-bold hover:shadow-[4px_4px_0_black] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                status === "ACTIVE"
                                                    ? "bg-[#FF005C] text-white hover:bg-red-600"
                                                    : "bg-[#00F0FF] text-black hover:bg-cyan-400"
                                            }`}
                                        >
                                            {isActionLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : status === "ACTIVE" ? (
                                                <Lock className="w-4 h-4" />
                                            ) : (
                                                <Unlock className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => resetKey(card.id)}
                                            className="p-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 hover:shadow-[4px_4px_0_black] transition-all"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <button className="p-6 bg-[#00F0FF] border-4 border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all">
                    <div className="text-xl font-bold text-black">
                        BULK LOCK
                    </div>
                    <div className="text-sm text-black font-medium">
                        LOCK ALL CARDS
                    </div>
                </button>

                <button className="p-6 bg-[#FF005C] border-4 border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all">
                    <div className="text-xl font-bold text-white">
                        EMERGENCY STOP
                    </div>
                    <div className="text-sm text-white font-medium">
                        SUSPEND ALL
                    </div>
                </button>

                <button className="p-6 bg-black border-4 border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all">
                    <div className="text-xl font-bold text-white">
                        RESET ALL KEYS
                    </div>
                    <div className="text-sm text-white font-medium">
                        BULK KEY RESET
                    </div>
                </button>
            </div>
        </div>
    );
};

export default WalletManagement;
