"use client";

import { useState } from "react";
import Dashboard from "@/components/admin/Dashboard";
import FraudMonitoring from "@/components/admin/FraudMonitoring";
import Sidebar from "@/components/admin/Sidebar";
import SmartContractControls from "@/components/admin/SmartContractControls";
import WalletManagement from "@/components/admin/WalletManagement";

type ActivePage = "dashboard" | "wallet" | "contracts" | "fraud";

export default function Page() {
    const [activePage, setActivePage] = useState<ActivePage>("dashboard");

    const renderActivePage = () => {
        switch (activePage) {
            case "dashboard":
                return <Dashboard />;
            case "wallet":
                return <WalletManagement />;
            case "contracts":
                return <SmartContractControls />;
            case "fraud":
                return <FraudMonitoring />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-white font-mono flex">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main
                className={`flex-1 p-4 lg:p-6 transition-all duration-300 ease-in-out`}
            >
                {renderActivePage()}
            </main>
        </div>
    );
}
