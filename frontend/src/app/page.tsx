"use client";
import BottomNavigation from "@/components/BottomNavigation";
import HomeScreen from "@/components/screens/HomeScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import TransactionsScreen from "@/components/screens/TransactionsScreen";
import { useState } from "react";

export default function Home() {
    const [activeTab, setActiveTab] = useState("home");
    const [showBalance, setShowBalance] = useState(true);

    const renderActiveScreen = () => {
        switch (activeTab) {
            case "home":
                return (
                    <HomeScreen
                        showBalance={showBalance}
                        onToggleBalance={() => setShowBalance(!showBalance)}
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

    return (
        <>
            {/* Main Content */}
            <div className="pb-20 min-h-screen">{renderActiveScreen()}</div>

            {/* Bottom Navigation */}
            <BottomNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
        </>
    );
}
