"use client";
import BottomNavigation from "@/components/BottomNavigation";
import HomeScreen from "@/components/screens/HomeScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import TransactionsScreen from "@/components/screens/TransactionsScreen";
import { useEffect, useState } from "react";
import { getUserCardsAPI, createCardAPI } from "@/lib/api-client";

export default function Home() {
    const [activeTab, setActiveTab] = useState("home");
    const [showBalance, setShowBalance] = useState(true);
    const [hasCard, setHasCard] = useState<boolean | null>(null);
    const [creating, setCreating] = useState(false);
    const [cardInfo, setCardInfo] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                console.log('[Home] Fetching user cards...');
                const res: any = await getUserCardsAPI();
                if (!mounted) return;
                const list = res?.cards || res?.data?.cards || res?.data || [];
                const has = Array.isArray(list) && list.length > 0;
                setHasCard(has);
                if (has) {
                    console.log('[Home] Cards fetched:', list);
                    setCardInfo(list[0]);
                } else {
                    console.log('[Home] No cards found');
                }
            } catch {
                console.error('[Home] Failed to fetch cards');
                setHasCard(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const handleCreateQuickCard = async () => {
        try {
            setCreating(true);
            const res: any = await createCardAPI({
                cardType: "virtual",
                cardName: "My NFC",
                limits: { daily: 300, monthly: 2000 },
            });
            console.log('[Home] createCardAPI response:', res);
            if (res?.success) {
                // Refetch cards to get latest info of created card
                const updated: any = await getUserCardsAPI();
                console.log('[Home] Refetched cards after create:', updated);
                const list = updated?.cards || updated?.data?.cards || updated?.data || [];
                const has = Array.isArray(list) && list.length > 0;
                setHasCard(has);
                if (has) setCardInfo(list[0]);
            } else if (res?.card || res?.data) {
                setHasCard(true);
                setCardInfo(res.card || res.data);
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
                                <h1 className="text-xl font-mono font-bold mb-3">You don’t have an NFC card yet</h1>
                                <p className="text-sm font-mono mb-6 opacity-80">Create a card to start using payment features.</p>
                                <button
                                    onClick={handleCreateQuickCard}
                                    disabled={creating}
                                    className="w-full py-3 bg-black text-white font-mono border-2 border-black disabled:opacity-60"
                                >
                                    {creating ? "Creating card..." : "Create card now"}
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
