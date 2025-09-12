import React from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Transaction } from "@/types";
import { mockTransactions } from "@/data/mockData";

const TransactionsScreen: React.FC = () => {
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

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    TRANSACTIONS
                </h1>
                <div className="w-20 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {["ALL", "PAYMENTS", "RECEIVED", "TRANSFERS"].map((filter) => (
                    <button
                        key={filter}
                        className="bg-neo-white border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow px-4 py-2 font-mono text-xs font-bold whitespace-nowrap"
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {mockTransactions.map((transaction) => {
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
                                                transaction.type === "transfer"
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
                                            {formatDate(transaction.date)}
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
                                        {isNegative ? "-" : "+"}$
                                        {Math.abs(transaction.amount).toFixed(
                                            2
                                        )}
                                    </p>
                                    <div className="flex items-center justify-end gap-1">
                                        <StatusIcon
                                            size={12}
                                            className={getStatusColor(
                                                transaction.status
                                            )}
                                        />
                                        <span
                                            className={`font-mono text-xs font-bold ${getStatusColor(
                                                transaction.status
                                            )}`}
                                        >
                                            {transaction.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
