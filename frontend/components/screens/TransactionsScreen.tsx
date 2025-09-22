import React, { useState, useEffect } from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";
import { Transaction } from "@/types";
import { getPaymentHistoryAPI } from "@/lib/api-client";
import { AxiosError } from "axios";

const TransactionsScreen: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("ALL");

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getPaymentHistoryAPI({
                    page: 1,
                    limit: 50,
                    status:
                        activeFilter === "ALL"
                            ? undefined
                            : activeFilter.toLowerCase(),
                });

                if (response.success && response.transactions) {
                    const formattedTransactions = response.transactions.map(
                        (tx: Transaction) => ({
                            id: tx.id,
                            type:
                                tx.type === "topup"
                                    ? "received"
                                    : tx.type === "payment"
                                    ? "payment"
                                    : tx.type === "withdraw"
                                    ? "transfer"
                                    : "transfer",
                            amount: tx.amount || 0,
                            status: tx.status || "pending",
                            description:
                                tx.description ||
                                `${tx.type.toUpperCase()} Transaction`,
                            date: tx.createdAt || new Date().toISOString(),
                            txHash: tx.txHash,
                        })
                    );
                    setTransactions(formattedTransactions as Transaction[]);
                } else {
                    setTransactions([]);
                }
            } catch (err) {
                console.error("Error loading transactions:", err);

                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load transactions");
                }

                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, [activeFilter]);

    const getTransactionIcon = (type: Transaction["type"]) => {
        switch (type) {
            case "payment":
                return ArrowUpRight;
            case "received":
                return ArrowDownLeft;
            case "transfer":
                return ArrowRightLeft;
            default:
                return ArrowRightLeft;
        }
    };

    const getStatusIcon = (status: Transaction["status"]) => {
        switch (status) {
            case "completed":
                return CheckCircle;
            case "pending":
                return Clock;
            case "failed":
                return XCircle;
            default:
                return Clock;
        }
    };

    const getStatusColor = (status: Transaction["status"]) => {
        switch (status) {
            case "completed":
                return "text-neo-cyan";
            case "pending":
                return "text-yellow-500";
            case "failed":
                return "text-neo-pink";
            default:
                return "text-neo-black";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                        TRANSACTIONS
                    </h1>
                    <div className="w-20 h-1 bg-neo-pink mx-auto"></div>
                </div>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neo-pink" />
                        <p className="text-lg font-semibold text-neo-black">
                            Loading transactions...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    TRANSACTIONS
                </h1>
                <div className="w-20 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 font-mono text-sm">
                    {error}
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {["ALL", "PAYMENTS", "RECEIVED", "TRANSFERS"].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow px-4 py-2 font-mono text-xs font-bold whitespace-nowrap ${
                            activeFilter === filter
                                ? "bg-neo-pink text-neo-white"
                                : "bg-neo-white"
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-lg font-semibold mb-2">
                            No transactions found
                        </div>
                        <div className="text-sm">
                            Transactions will appear here when available
                        </div>
                    </div>
                ) : (
                    transactions.map((transaction) => {
                        const TransactionIcon = getTransactionIcon(
                            transaction.type
                        );
                        const StatusIcon = getStatusIcon(transaction.status);
                        const isNegative = transaction.amount < 0;

                        return (
                            <div
                                key={transaction.id}
                                className="bg-neo-white border-4 border-neo-black shadow-brutal p-4 hover:shadow-brutal-lg transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`p-3 border-2 border-neo-black ${
                                                transaction.type === "payment"
                                                    ? "bg-neo-pink"
                                                    : transaction.type ===
                                                      "received"
                                                    ? "bg-neo-cyan"
                                                    : "bg-neo-black"
                                            }`}
                                        >
                                            <TransactionIcon
                                                size={20}
                                                className={
                                                    transaction.type ===
                                                    "transfer"
                                                        ? "text-neo-white"
                                                        : "text-neo-black"
                                                }
                                            />
                                        </div>

                                        <div>
                                            <p className="font-mono font-bold text-sm text-neo-black">
                                                {transaction.description}
                                            </p>
                                            <p className="font-mono text-xs text-neo-black opacity-70">
                                                {formatDate(
                                                    transaction.date ||
                                                        new Date().toISOString()
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p
                                            className={`font-mono font-bold text-lg ${
                                                isNegative
                                                    ? "text-neo-pink"
                                                    : "text-neo-cyan"
                                            }`}
                                        >
                                            {isNegative ? "-" : "+"}
                                            {Math.abs(
                                                transaction.amount
                                            ).toFixed(2)}{" "}
                                            SUI
                                        </p>
                                        <div className="flex items-center justify-end gap-1">
                                            <StatusIcon
                                                size={12}
                                                className={getStatusColor(
                                                    transaction.status ||
                                                        "pending"
                                                )}
                                            />
                                            <span
                                                className={`font-mono text-xs font-bold ${getStatusColor(
                                                    transaction.status ||
                                                        "pending"
                                                )}`}
                                            >
                                                {(
                                                    transaction.status ||
                                                    "pending"
                                                ).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Load More Button */}
            <div className="text-center pt-4">
                <button className="bg-neo-black text-neo-white border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow px-6 py-3 font-mono font-bold">
                    LOAD MORE TRANSACTIONS
                </button>
            </div>
        </div>
    );
};

export default TransactionsScreen;
