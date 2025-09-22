"use client";
import BottomNavigation from "@/components/layout/BottomNavigation";
import HomeScreen from "@/components/screens/HomeScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import TransactionsScreen from "@/components/screens/TransactionsScreen";
import { useEffect, useState } from "react";
import { getUserCardsAPI, createCardAPI } from "@/lib/api-client";
import { Card } from "@/types";
import { useWalletContext } from "@/contexts/WalletContext";

export default function Home() {
    const [activeTab, setActiveTab] = useState("home");
    const [showBalance, setShowBalance] = useState(true);
    const [hasCard, setHasCard] = useState<boolean | null>(null);
    const [creating, setCreating] = useState(false);
    const [cardInfo, setCardInfo] = useState<Card | null>(null);
    const { createWallet } = useWalletContext();

    const loadCards = async () => {
        try {
            console.log("🔄 [Home] Fetching user cards...");
            const res = await getUserCardsAPI();
            const list = res.data.cards || [];
            const has = Array.isArray(list) && list.length > 0;
            setHasCard(has);
            if (has) {
                console.log("📋 [Home] Cards fetched:", list);
                console.log("📋 [Home] First card details:", {
                    id: list[0].id,
                    cardUuid: list[0].cardUuid,
                    isActive: list[0].isActive,
                    blockedAt: list[0].blockedAt,
                    blockedReason: list[0].blockedReason,
                    cardType: list[0].cardType,
                });
                setCardInfo(list[0]);
            } else {
                console.log("❌ [Home] No cards found");
            }
        } catch {
            console.error("💥 [Home] Failed to fetch cards");
            setHasCard(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (mounted) {
                await loadCards();
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Listen for card changes from other components
    useEffect(() => {
        const handleCardChange = () => {
            console.log("🔄 [Home] Card change detected, refreshing...");
            loadCards();
        };

        // Listen for custom events
        window.addEventListener("cardBlocked", handleCardChange);
        window.addEventListener("cardUnblocked", handleCardChange);

        return () => {
            window.removeEventListener("cardBlocked", handleCardChange);
            window.removeEventListener("cardUnblocked", handleCardChange);
        };
    }, []);

    const handleCreateQuickCard = async () => {
        try {
            setCreating(true);
            const res = await createCardAPI({
                cardType: "virtual",
                cardName: "My NFC",
                limits: { daily: 300, monthly: 2000 },
            });
            console.log("[Home] createCardAPI response:", res);

            if (res.success) {
                // Create wallet address
                await createWallet();
                // Refetch cards to get latest info of created card
                const updated = await getUserCardsAPI();
                console.log("[Home] Refetched cards after create:", updated);
                const list = updated.data.cards || [];
                const has = Array.isArray(list) && list.length > 0;
                setHasCard(has);
                if (has) setCardInfo(list[0]);
            } else if (res.data) {
                setHasCard(true);
                setCardInfo(res.data);
            }
        } finally {
            setCreating(false);
        }
    };

    const renderActiveScreen = () => {
        switch (activeTab) {
            case "home":
                if (!hasCard) {
                    return (
                        <div className="min-h-[60vh] flex items-center justify-center p-6">
                            <div className="max-w-md w-full border-2 border-black p-6 text-center">
                                <h1 className="text-xl font-mono font-bold mb-3">
                                    You don’t have an NFC card yet
                                </h1>
                                <p className="text-sm font-mono mb-6 opacity-80">
                                    Create a card to start using payment
                                    features.
                                </p>
                                <button
                                    onClick={handleCreateQuickCard}
                                    disabled={creating}
                                    className="w-full py-3 bg-black text-white font-mono border-2 border-black disabled:opacity-60"
                                >
                                    {creating
                                        ? "Creating card..."
                                        : "Create card now"}
                                </button>
                            </div>
                        </div>
                    );
                }
                return (
                    <HomeScreen
                        showBalance={showBalance}
                        onToggleBalance={() => setShowBalance(!showBalance)}
                        card={cardInfo}
                    />
                );
            case "transactions":
                return <TransactionsScreen />;
            case "settings":
                return <SettingsScreen />;
            case "profile":
                return <ProfileScreen />;
            default:
                return (
                    <HomeScreen
                        showBalance={showBalance}
                        onToggleBalance={() => setShowBalance(!showBalance)}
                    />
                );
        }
    };

    if (hasCard === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <>
            <div className="pb-20 min-h-screen">{renderActiveScreen()}</div>
            <BottomNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
        </>
    );
}
