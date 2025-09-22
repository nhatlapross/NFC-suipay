"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import merchantAPI, {
    MerchantCredentials,
    Transaction as MerchantTx,
} from "@/lib/merchant-api";

async function fetchRecent(): Promise<MerchantTx[]> {
    const stored = localStorage.getItem("merchantCredentials");
    if (!stored) return [];
    const creds: MerchantCredentials = JSON.parse(stored);
    merchantAPI.setCredentials(creds);
    const res = await merchantAPI.getPayments(1, 5);
    if (res.success && res.data) return res.data.payments || [];
    return [];
}

export default function MerchantRecentTransactions() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["merchant:recentTx"],
        queryFn: fetchRecent,
    });

    return (
        <div className="bg-white border border-gray-900 rounded-md shadow-sm">
            <div className="px-4 py-3 border-b border-gray-900 flex items-center justify-between">
                <div className="text-xs font-bold text-gray-800">
                    RECENT TRANSACTIONS
                </div>
                <Link
                    href="/history"
                    className="text-xs px-2 py-1 border border-gray-900 rounded-sm"
                >
                    VIEW ALL
                </Link>
            </div>
            <ul className="divide-y divide-gray-200">
                {isLoading && <li className="px-4 py-3 text-xs">Loading...</li>}
                {isError && (
                    <li className="px-4 py-3 text-xs text-red-600">
                        Failed to load
                    </li>
                )}
                {data?.map((tx) => (
                    <li
                        key={tx._id}
                        className="px-4 py-3 flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <div
                                className={`w-6 h-6 rounded-sm border border-gray-900 flex items-center justify-center ${
                                    tx.status === "completed"
                                        ? "bg-[#00e5ff]"
                                        : "bg-[#ff007f]"
                                }`}
                            ></div>
                            <div>
                                <div className="text-xs font-semibold">
                                    {tx.transactionId || tx._id}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                    {tx.customerName || "-"}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-semibold">
                                {Number(tx.amount).toFixed(2)}{" "}
                                {tx.currency || "SUI"}
                            </div>
                            <div
                                className={`text-[10px] uppercase ${
                                    tx.status === "completed"
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {tx.status === "completed"
                                    ? "Success"
                                    : "Failed"}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
