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
import {
    getAdminDashboardAPI,
    getAdminCardsAPI,
    getAdminTransactionsAPI,
    DashboardStats,
    CardStats,
    FullTransaction,
} from "@/lib/api-client";
import { AxiosError } from "axios";

interface FlowStats {
    inflow: {
        today: number;
        week: number;
        month: number;
    };
    outflow: {
        today: number;
        week: number;
        month: number;
    };
}

const initialStats: DashboardStats = {
    totalTransactions: {
        today: 0,
        week: 0,
        month: 0,
    },
    totalVolume: {
        today: 0,
        week: 0,
        month: 0,
    },
    successRate: {
        today: 0,
        week: 0,
        month: 0,
    },
    activeCards: 0,
    activeMerchants: 0,
    averageTransactionTime: 0,
};

const initialCardStats = {
    active: 0,
    blocked: 0,
    inactive: 0,
};

const Dashboard: React.FC = () => {
    const [dashboardStats, setDashboardStats] =
        useState<DashboardStats>(initialStats);
    const [cardStats, setCardStats] = useState<CardStats>(initialCardStats);
    const [flowStats, setFlowStats] = useState<FlowStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recentTransactions, setRecentTransactions] = useState<
        FullTransaction[]
    >([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError("");
                console.log("🔄 [Dashboard] Loading dashboard data...");

                // Load dashboard stats
                const dashboardResponse = await getAdminDashboardAPI();
                console.log(" [Dashboard] Dashboard stats:", dashboardResponse);

                if (dashboardResponse.success && dashboardResponse.data) {
                    setDashboardStats(dashboardResponse.data);
                }

                // Load card stats
                const cardResponse = await getAdminCardsAPI();
                console.log(" [Dashboard] Card stats:", cardResponse);

                if (cardResponse.success && cardResponse.data.cardStats) {
                    setCardStats(cardResponse.data.cardStats);
                }

                // Load recent transactions
                const transactionsResponse = await getAdminTransactionsAPI({
                    page: 1,
                    limit: 100,
                    status: "all",
                });
                console.log(" [Dashboard] Transactions:", transactionsResponse);

                if (
                    transactionsResponse.success &&
                    transactionsResponse.data.transactions
                ) {
                    const transactions = transactionsResponse.data.transactions;
                    console.log(
                        "📊 [Dashboard] Raw transactions data:",
                        transactions.slice(0, 3)
                    ); // Log first 3 transactions

                    // Calculate flow stats from transactions
                    const now = new Date();
                    const today = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                    );
                    const weekAgo = new Date(
                        today.getTime() - 7 * 24 * 60 * 60 * 1000
                    );
                    const monthAgo = new Date(
                        today.getTime() - 30 * 24 * 60 * 60 * 1000
                    );

                    const calculateFlowStats = (
                        transactions: FullTransaction[],
                        startDate: Date
                    ) => {
                        const filteredTxs = transactions.filter((tx) => {
                            const txDate = new Date(tx.createdAt);
                            return (
                                txDate >= startDate && tx.status === "completed"
                            );
                        });

                        const inflow = filteredTxs
                            .filter((tx) => tx.type === "topup")
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0);

                        const outflow = filteredTxs
                            .filter((tx) =>
                                ["payment", "withdraw"].includes(tx.type)
                            )
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0);

                        console.log("📊 [Dashboard] Flow calculation:", {
                            startDate: startDate.toISOString(),
                            totalTxs: filteredTxs.length,
                            inflowTxs: filteredTxs.filter(
                                (tx) => tx.type === "topup"
                            ).length,
                            outflowTxs: filteredTxs.filter((tx) =>
                                ["payment", "withdraw"].includes(tx.type)
                            ).length,
                            inflow,
                            outflow,
                        });

                        return { inflow, outflow };
                    };

                    const todayStats = calculateFlowStats(transactions, today);
                    const weekStats = calculateFlowStats(transactions, weekAgo);
                    const monthStats = calculateFlowStats(
                        transactions,
                        monthAgo
                    );

                    setFlowStats({
                        inflow: {
                            today: todayStats.inflow,
                            week: weekStats.inflow,
                            month: monthStats.inflow,
                        },
                        outflow: {
                            today: todayStats.outflow,
                            week: weekStats.outflow,
                            month: monthStats.outflow,
                        },
                    });

                    const formattedTransactions = transactions.map(
                        (tx: FullTransaction) => ({
                            _id: tx._id,
                            amount: tx.amount || 0,
                            type: (tx.type === "topup"
                                ? "inflow"
                                : "outflow") as "inflow" | "outflow",
                            status: tx.status || "pending",
                            time: new Date(tx.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            ),
                            createdAt: tx.createdAt,
                            txHash: tx.txHash,
                            userId: tx.userId && {
                                fullName: tx.userId.fullName || "Unknown User",
                                email: tx.userId.email || "unknown@example.com",
                            },
                        })
                    );
                    setRecentTransactions(formattedTransactions);
                } else {
                    // Fallback data when no transactions
                    setFlowStats({
                        inflow: { today: 0, week: 0, month: 0 },
                        outflow: { today: 0, week: 0, month: 0 },
                    });
                    setRecentTransactions([]);
                }

                console.log(
                    "✅ [Dashboard] Dashboard data loaded successfully"
                );
            } catch (err) {
                console.error(
                    "💥 [Dashboard] Error loading dashboard data:",
                    err
                );

                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load dashboard data");
                }

                // Set fallback data on error
                setDashboardStats({
                    totalTransactions: { today: 0, week: 0, month: 0 },
                    totalVolume: { today: 0, week: 0, month: 0 },
                    successRate: { today: 0, week: 0, month: 0 },
                    activeCards: 0,
                    activeMerchants: 0,
                    averageTransactionTime: 0,
                });
                setCardStats({
                    active: 0,
                    blocked: 0,
                    inactive: 0,
                });
                setFlowStats({
                    inflow: { today: 0, week: 0, month: 0 },
                    outflow: { today: 0, week: 0, month: 0 },
                });
                setRecentTransactions([]);
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
                    <p className="text-lg font-semibold text-black">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full">
            <div className="border-4 border-black bg-[#00F0FF] p-6 shadow-[8px_8px_0_black]">
                <h1 className="text-3xl font-bold text-black mb-2">
                    DASHBOARD OVERVIEW
                </h1>
                <p className="text-black font-medium">
                    REAL-TIME SYSTEM MONITORING
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
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
                                {formatAmount(flowStats?.inflow?.today)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">WEEKLY</span>
                            <span className="text-xl font-bold text-black">
                                {formatAmount(flowStats?.inflow?.week)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">
                                MONTHLY
                            </span>
                            <span className="text-xl font-bold text-black">
                                {formatAmount(flowStats?.inflow?.month)}
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
                                {formatAmount(flowStats?.outflow?.today)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">WEEKLY</span>
                            <span className="text-xl font-bold text-black">
                                {formatAmount(flowStats?.outflow?.week)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border-2 border-black">
                            <span className="font-bold text-black">
                                MONTHLY
                            </span>
                            <span className="text-xl font-bold text-black">
                                {formatAmount(flowStats?.outflow?.month)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border-4 border-black p-4 lg:p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-bold mb-6 text-black">
                    RECENT TRANSACTIONS
                </h2>
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-semibold">
                        {error}
                    </div>
                )}
                <div className="space-y-3 overflow-x-auto">
                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-semibold mb-2">
                                No transactions found
                            </div>
                            <div className="text-sm">
                                Transactions will appear here when available
                            </div>
                        </div>
                    ) : (
                        recentTransactions.map((tx) => (
                            <div
                                key={tx._id}
                                className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 border-2 border-black bg-white hover:bg-gray-100 gap-3 lg:gap-0"
                            >
                                <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                                    <div className="font-bold text-black text-sm">
                                        {tx._id}
                                    </div>
                                    <div
                                        className={`px-2 py-1 border-2 border-black font-bold text-xs ${
                                            tx.type === "inflow"
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
                                <div className="flex items-center justify-between lg:justify-end gap-4">
                                    <div className="font-bold text-black text-sm lg:text-base">
                                        {formatAmount(tx.amount)}
                                    </div>
                                    <div className="flex items-center gap-2 lg:gap-4">
                                        <div
                                            className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                                                tx.status === "completed"
                                                    ? "bg-black text-white"
                                                    : tx.status === "pending"
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
                                                    {tx.txHash.substring(0, 8)}
                                                    ...
                                                </span>
                                            </a>
                                        )}
                                        <div className="text-sm font-bold text-gray-600">
                                            {tx.time}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
