"use client";
import {
    TrendingUp,
    TrendingDown,
    CreditCard,
    DollarSign,
    Users,
    Activity,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getAdminDashboardAPI, getAdminCardsAPI, getAdminTransactionsAPI } from "@/lib/api-client";

interface DashboardStats {
    totalTransactions: {
        today: number;
        week: number;
        month: number;
    };
    totalVolume: {
        today: number;
        week: number;
        month: number;
    };
    successRate: {
        today: number;
        week: number;
        month: number;
    };
    activeCards: number;
    activeMerchants: number;
    averageTransactionTime: number;
}

interface CardStats {
    active: number;
    blocked: number;
    inactive: number;
}

interface Transaction {
    id: string;
    amount: number;
    type: "INFLOW" | "OUTFLOW";
    status: "COMPLETED" | "PENDING" | "FAILED";
    time: string;
    txHash?: string;
    userId?: {
        fullName: string;
        email: string;
    };
    merchantId?: {
        merchantName: string;
        businessType: string;
    };
}

const Dashboard: React.FC = () => {
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [cardStats, setCardStats] = useState<CardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError("");
                console.log('🔄 [Dashboard] Loading dashboard data...');

                // Load dashboard stats
                const dashboardResponse = await getAdminDashboardAPI();
                console.log(' [Dashboard] Dashboard stats:', dashboardResponse);
                
                if (dashboardResponse?.success && dashboardResponse?.data) {
                    setDashboardStats(dashboardResponse.data);
                }

                // Load card stats
                const cardResponse = await getAdminCardsAPI();
                console.log(' [Dashboard] Card stats:', cardResponse);
                
                if (cardResponse?.success && cardResponse?.data?.cardStats) {
                    setCardStats(cardResponse.data.cardStats);
                }

                // Load recent transactions
                const transactionsResponse = await getAdminTransactionsAPI({
                    page: 1,
                    limit: 100,
                    status: 'all'
                });
                console.log(' [Dashboard] Transactions:', transactionsResponse);
                
                if (transactionsResponse?.success && transactionsResponse?.data?.transactions) {
                    const formattedTransactions = transactionsResponse.data.transactions.map((tx: any) => ({
                        id: tx._id || tx.id,
                        amount: tx.amount || 0,
                        type: tx.type === 'payment' ? 'INFLOW' : 'OUTFLOW',
                        status: tx.status?.toUpperCase() || 'PENDING',
                        time: new Date(tx.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        txHash: tx.txHash,
                        userId: tx.userId ? {
                            fullName: tx.userId.fullName || 'Unknown User',
                            email: tx.userId.email || 'unknown@example.com'
                        } : undefined
                    }));
                    setRecentTransactions(formattedTransactions);
                }

                console.log('✅ [Dashboard] Dashboard data loaded successfully');
            } catch (err: any) {
                console.error('💥 [Dashboard] Error loading dashboard data:', err);
                setError(err?.response?.data?.error || "Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const formatNumber = (num: number | undefined) => {
        if (!num && num !== 0) return "0";
        return num.toLocaleString();
    };

    const formatAmount = (amount: number | undefined) => {
        if (!amount && amount !== 0) return "$0";
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount.toFixed(2)}`;
    };

    const stats = [
        {
            label: "ACTIVE CARDS",
            value: formatNumber(cardStats?.active),
            icon: CreditCard,
            color: "bg-[#FF005C] text-white",
        },
        {
            label: "DAILY VOLUME",
            value: formatAmount(dashboardStats?.totalVolume?.today),
            icon: DollarSign,
            color: "bg-[#00F0FF]",
        },
        {
            label: "TOTAL USERS",
            value: formatNumber(dashboardStats?.activeMerchants),
            icon: Users,
            color: "bg-black text-white",
        },
        {
            label: "TRANSACTIONS",
            value: formatNumber(dashboardStats?.totalTransactions?.today),
            icon: Activity,
            color: "bg-white text-black border-2 border-black",
        },
    ];

    const transactions = [
        {
            id: "TXN001",
            amount: "$2,450.00",
            type: "INFLOW",
            status: "COMPLETED",
            time: "14:32",
        },
        {
            id: "TXN002",
            amount: "$890.50",
            type: "OUTFLOW",
            status: "PENDING",
            time: "14:28",
        },
        {
            id: "TXN003",
            amount: "$5,200.00",
            type: "INFLOW",
            status: "COMPLETED",
            time: "14:15",
        },
        {
            id: "TXN004",
            amount: "$1,100.75",
            type: "OUTFLOW",
            status: "FAILED",
            time: "14:02",
        },
        {
            id: "TXN005",
            amount: "$750.00",
            type: "INFLOW",
            status: "COMPLETED",
            time: "13:58",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF005C]" />
                    <p className="text-lg font-semibold text-black">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="border-4 border-black bg-[#00F0FF] p-6 shadow-[8px_8px_0_black]">
                <h1 className="text-3xl font-bold text-black mb-2">
                    DASHBOARD OVERVIEW
                </h1>
                <p className="text-black font-medium">
                    REAL-TIME SYSTEM MONITORING
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`${stat.color} p-6 border-4 border-black shadow-[6px_6px_0_black]`}
                        >
                            <div className="flex items-center justify-between">
                                <Icon className="w-8 h-8" />
                                <div className="flex flex-col justify-between">
                                    <div className="text-2xl font-bold">
                                        {stat.value}
                                    </div>
                                    <div className="font-semibold text-sm">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Flow Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                    <h2 className="text-xl font-bold mb-4 text-black">
                        INFLOW SUMMARY
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#00F0FF] border-2 border-black">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-black" />
                                <span className="font-bold text-black">
                                    TODAY
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-black">
                                $847,230
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">WEEKLY</span>
                            <span className="text-xl font-bold text-black">
                                $5.2M
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">
                                MONTHLY
                            </span>
                            <span className="text-xl font-bold text-black">
                                $18.7M
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                    <h2 className="text-xl font-bold mb-4 text-black">
                        OUTFLOW SUMMARY
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#FF005C] border-2 border-black">
                            <div className="flex items-center gap-3">
                                <TrendingDown className="w-6 h-6 text-white" />
                                <span className="font-bold text-white">
                                    TODAY
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                                $623,180
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">WEEKLY</span>
                            <span className="text-xl font-bold text-black">
                                $3.8M
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">
                                MONTHLY
                            </span>
                            <span className="text-xl font-bold text-black">
                                $14.2M
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-bold mb-6 text-black">
                    RECENT TRANSACTIONS
                </h2>
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-semibold">
                        {error}
                    </div>
                )}
                <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 border-2 border-black bg-white hover:bg-gray-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="font-bold text-black">
                                    {tx.id}
                                </div>
                                <div
                                    className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                                        tx.type === "INFLOW"
                                            ? "bg-[#00F0FF] text-black"
                                            : "bg-[#FF005C] text-white"
                                    }`}
                                >
                                    {tx.type}
                                </div>
                                {tx.userId && (
                                    <div className="text-xs text-gray-600">
                                        {tx.userId.fullName}
                                    </div>
                                )}
                                {tx.merchantId && (
                                    <div className="text-xs text-blue-600">
                                        {tx.merchantId.merchantName}
                                    </div>
                                )}
                            </div>
                            <div className="font-bold text-black">
                                {formatAmount(tx.amount)}
                            </div>
                            <div className="flex items-center gap-4">
                                <div
                                    className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                                        tx.status === "COMPLETED"
                                            ? "bg-black text-white"
                                            : tx.status === "PENDING"
                                            ? "bg-yellow-400 text-black"
                                            : "bg-red-500 text-white"
                                    }`}
                                >
                                    {tx.status}
                                </div>
                                {tx.txHash && (
                                    <a
                                        href={`https://suiscan.xyz/testnet/tx/${tx.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span className="font-mono">
                                            {tx.txHash.substring(0, 8)}...
                                        </span>
                                    </a>
                                )}
                                <div className="text-sm font-bold text-gray-600">
                                    {tx.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
