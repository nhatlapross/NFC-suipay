"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DollarSign,
    TrendingUp,
    Users,
    Clock,
    CreditCard,
    QrCode,
    List,
    User,
} from "lucide-react";
import MerchantHeader from "@/components/merchant/MerchantHeader";
import NFCTerminal from "@/components/merchant/nfc/NFCTerminal";
import QRPaymentTerminal from "@/components/merchant/qr/QRPaymentTerminal";
import TransactionManagement from "@/components/merchant/transactions/TransactionManagement";
import MerchantAPITest from "@/components/merchant/MerchantAPITest";
import MerchantSettings from "@/components/merchant/settings/MerchantSettings";
import { useEffect, useState } from "react";
import merchantAPI, {
    MerchantCredentials,
    PaymentStats,
} from "@/lib/merchant-api";
import MerchantRecentTransactions from "@/components/merchant/MerchantRecentTransactions";

export default function MerchantTerminal() {
    const [view, setView] = useState<
        "dashboard" | "nfc" | "qr" | "tx" | "settings" | "api-test"
    >("dashboard");
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setStatsLoading(true);
                setStatsError(null);
                const stored = localStorage.getItem("merchantCredentials");
                if (!stored) return;
                const creds: MerchantCredentials = JSON.parse(stored);
                merchantAPI.setCredentials(creds);
                const res = await merchantAPI.getPaymentStats();
                if (res.success && res.data) setStats(res.data);
                else setStatsError(res.error || "Failed to load stats");
            } finally {
                setStatsLoading(false);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            {/* Header */}
            <MerchantHeader
                containerClassName="max-w-4xl"
                view={view}
                onViewChange={setView}
            />

            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                {view === "nfc" ? (
                    <div className="space-y-4">
                        <NFCTerminal />
                    </div>
                ) : view === "qr" ? (
                    <div className="space-y-4">
                        <QRPaymentTerminal />
                    </div>
                ) : view === "tx" ? (
                    <div className="space-y-4">
                        <TransactionManagement />
                    </div>
                ) : view === "settings" ? (
                    <div className="space-y-4">
                        <MerchantSettings />
                    </div>
                ) : view === "api-test" ? (
                    <div className="space-y-4">
                        <MerchantAPITest />
                    </div>
                ) : (
                    <>
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="p-3 border-4 border-black bg-white shadow-[8px_8px_0_black]">
                                <div className="h-full flex justify-center items-center gap-3">
                                    <div className="bg-[#ff005c] p-2 rounded">
                                        <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="w-full text-right">
                                        <div className="text-xl font-bold text-black">
                                            {stats
                                                ? `${Number(
                                                      stats.today.volume || 0
                                                  ).toFixed(2)} SUI`
                                                : statsLoading
                                                ? "..."
                                                : "0.00 SUI"}
                                        </div>
                                        <div className="text-sm text-gray-600 uppercase">
                                            TODAY&apos;S SALES
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-3 border-4 border-black bg-white shadow-[8px_8px_0_black]">
                                <div className="h-full flex justify-center items-center gap-3">
                                    <div className="bg-[#00f0ff] p-2 rounded">
                                        <TrendingUp className="h-4 w-4 text-black" />
                                    </div>
                                    <div className="w-full text-right">
                                        <div className="text-xl font-bold text-black">
                                            {stats
                                                ? stats.today.transactions
                                                : statsLoading
                                                ? "..."
                                                : 0}
                                        </div>
                                        <div className="text-sm text-gray-600 uppercase">
                                            TRANSACTIONS
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-3 border-4 border-black bg-white shadow-[8px_8px_0_black]">
                                <div className="h-full flex justify-center items-center gap-3">
                                    <div className="bg-[#4ade80] p-2 rounded">
                                        <Users className="h-4 w-4 text-black" />
                                    </div>
                                    <div className="w-full text-right">
                                        <div className="text-xl font-bold text-black">
                                            {stats
                                                ? stats.overall.transactions
                                                : statsLoading
                                                ? "..."
                                                : 0}
                                        </div>
                                        <div className="text-sm text-gray-600 uppercase">
                                            OVERALL TRANSACTIONS
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-3 border-4 border-black bg-white shadow-[8px_8px_0_black]">
                                <div className="h-full flex justify-center items-center gap-3">
                                    <div className="bg-[#facc15] p-2 rounded">
                                        <Clock className="h-4 w-4 text-black" />
                                    </div>
                                    <div className="w-full text-right">
                                        <div className="text-xl font-bold text-black">
                                            -
                                        </div>
                                        <div className="text-sm text-gray-600 uppercase">
                                            AVG TIME
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <Card className="p-6 border-4 border-black bg-white shadow-[8px_8px_0_black]">
                            <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">
                                Quick Actions
                            </h2>
                            <div className="space-y-4">
                                <Button
                                    onClick={() => setView("nfc")}
                                    className="w-full bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black h-20 text-base font-bold p-0"
                                >
                                    <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                                        <CreditCard className="h-6 w-6 shrink-0" />
                                        <span className="text-lg font-bold leading-tight">
                                            NFC PAYMENT
                                        </span>
                                        <span className="text-sm opacity-90 leading-tight">
                                            TAP CARD TO PAY
                                        </span>
                                    </div>
                                </Button>

                                <Button
                                    onClick={() => setView("qr")}
                                    className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black border-4 border-black h-20 text-base font-bold p-0"
                                >
                                    <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                                        <QrCode className="h-6 w-6 shrink-0" />
                                        <span className="text-lg font-bold leading-tight">
                                            QR PAYMENT
                                        </span>
                                        <span className="text-sm opacity-90 leading-tight">
                                            GENERATE QR CODE
                                        </span>
                                    </div>
                                </Button>

                                <Button
                                    onClick={() => setView("tx")}
                                    className="w-full bg-[#c084fc] hover:bg-[#c084fc]/90 text-black border-4 border-black h-20 text-base font-bold p-0"
                                >
                                    <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                                        <List className="h-6 w-6 shrink-0" />
                                        <span className="text-lg font-bold leading-tight">
                                            TRANSACTIONS
                                        </span>
                                        <span className="text-sm opacity-90 leading-tight">
                                            VIEW HISTORY
                                        </span>
                                    </div>
                                </Button>

                                <Button
                                    onClick={() => setView("settings")}
                                    className="w-full bg-[#fb923c] hover:bg-[#fb923c]/90 text-black border-4 border-black h-20 text-base font-bold p-0"
                                >
                                    <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                                        <User className="h-6 w-6 shrink-0" />
                                        <span className="text-lg font-bold leading-tight">
                                            PROFILE
                                        </span>
                                        <span className="text-sm opacity-90 leading-tight">
                                            SETTINGS
                                        </span>
                                    </div>
                                </Button>

                                <Button
                                    onClick={() => setView("api-test")}
                                    className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white border-4 border-black h-20 text-base font-bold p-0"
                                >
                                    <div className="flex w-full h-full flex-col items-center justify-center gap-1 overflow-hidden text-center">
                                        <div className="h-6 w-6 shrink-0 bg-white rounded flex items-center justify-center">
                                            <span className="text-[#8b5cf6] font-bold text-sm">
                                                API
                                            </span>
                                        </div>
                                        <span className="text-lg font-bold leading-tight">
                                            API TEST
                                        </span>
                                        <span className="text-sm opacity-90 leading-tight">
                                            CONNECTION
                                        </span>
                                    </div>
                                </Button>
                            </div>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="p-6 border-4 border-black bg-white shadow-[8px_8px_0_black]">
                            <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">
                                Recent Transactions
                            </h2>

                            <Button
                                variant="outline"
                                onClick={() => setView("tx")}
                                className="w-full mb-5 border-2 border-black bg-[#e5e7eb] hover:bg-[#e5e7eb]/80 text-black font-bold text-base"
                            >
                                VIEW ALL
                            </Button>

                            <MerchantRecentTransactions />
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
