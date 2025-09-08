"use client";
import {
    TrendingUp,
    TrendingDown,
    CreditCard,
    DollarSign,
    Users,
    Activity,
} from "lucide-react";

const Dashboard: React.FC = () => {
    const stats = [
        {
            label: "ACTIVE CARDS",
            value: "2,847",
            icon: CreditCard,
            color: "bg-[#FF005C] text-white",
        },
        {
            label: "DAILY VOLUME",
            value: "$1.2M",
            icon: DollarSign,
            color: "bg-[#00F0FF]",
        },
        {
            label: "TOTAL USERS",
            value: "15,432",
            icon: Users,
            color: "bg-black text-white",
        },
        {
            label: "TRANSACTIONS",
            value: "8,921",
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
                <div className="space-y-3">
                    {transactions.map((tx) => (
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
                            </div>
                            <div className="font-bold text-black">
                                {tx.amount}
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
