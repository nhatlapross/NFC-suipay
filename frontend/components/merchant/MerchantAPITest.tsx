"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMerchantAPI } from "@/hooks/useMerchantAPI";
import { MerchantCredentials } from "@/lib/merchant-api";

export default function MerchantAPITest() {
    const [publicKey, setPublicKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [merchantId, setMerchantId] = useState("");

    const {
        credentials,
        profile,
        stats,
        transactions,
        loading,
        error,
        setMerchantCredentials,
        loadAllData,
    } = useMerchantAPI();

    // Load stored credentials on component mount
    useEffect(() => {
        const storedCredentials = localStorage.getItem("merchantCredentials");
        if (storedCredentials) {
            try {
                const creds = JSON.parse(storedCredentials);
                setMerchantId(creds.merchantId || "");
                setPublicKey(creds.publicKey || "");
                setSecretKey(creds.secretKey || "");
            } catch (error) {
                console.error("Failed to parse stored credentials:", error);
            }
        }
    }, []);

    const handleConnect = () => {
        const creds: MerchantCredentials = {
            merchantId,
            publicKey,
            secretKey,
        };
        setMerchantCredentials(creds);
    };

    const handleRefresh = () => {
        loadAllData();
    };

    return (
        <div className="space-y-6">
            {/* Connection Form */}
            <Card className="p-6 border-4 border-black shadow-[8px_8px_0_black]">
                <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">
                    Merchant API Test
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-black mb-2">
                            Merchant ID
                        </label>
                        <Input
                            value={merchantId}
                            onChange={(e) => setMerchantId(e.target.value)}
                            className="border-4 border-black"
                            placeholder="mch_xxxxxxxxxxxxxxxx"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-black mb-2">
                            Public Key
                        </label>
                        <Input
                            value={publicKey}
                            onChange={(e) => setPublicKey(e.target.value)}
                            className="border-4 border-black"
                            placeholder="pk_xxxxxxxxxxxxxxxx"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-black mb-2">
                            Secret Key
                        </label>
                        <Input
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            className="border-4 border-black"
                            placeholder="sk_xxxxxxxxxxxxxxxx"
                            type="password"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={handleConnect}
                            className="bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black shadow-[4px_4px_0_black]"
                        >
                            Connect to API
                        </Button>

                        <Button
                            onClick={handleRefresh}
                            disabled={!credentials}
                            className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black border-4 border-black shadow-[4px_4px_0_black]"
                        >
                            Refresh Data
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Status */}
            {credentials && (
                <Card className="p-6 border-4 border-black shadow-[8px_8px_0_black]">
                    <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wide">
                        Connection Status
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-bold text-green-700">
                                Connected to Merchant API
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            <div>Merchant ID: {credentials.merchantId}</div>
                            <div>
                                Public Key:{" "}
                                {credentials.publicKey.substring(0, 20)}...
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="p-6 border-4 border-red-500 bg-red-50 shadow-[8px_8px_0_red]">
                    <h3 className="text-xl font-bold text-red-700 mb-2">
                        Error
                    </h3>
                    <p className="text-red-600">{error}</p>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <Card className="p-6 border-4 border-black shadow-[8px_8px_0_black]">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff005c]"></div>
                        <span className="font-bold text-black">
                            Loading merchant data...
                        </span>
                    </div>
                </Card>
            )}

            {/* Profile Data */}
            {profile && (
                <Card className="p-6 border-4 border-black shadow-[8px_8px_0_black]">
                    <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wide">
                        Merchant Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="font-bold text-black">Name:</div>
                            <div className="text-gray-700">
                                {profile.merchantName}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-black">
                                Business Type:
                            </div>
                            <div className="text-gray-700">
                                {profile.businessType}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-black">Email:</div>
                            <div className="text-gray-700">{profile.email}</div>
                        </div>
                        <div>
                            <div className="font-bold text-black">Phone:</div>
                            <div className="text-gray-700">
                                {profile.phoneNumber}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-black">Status:</div>
                            <div
                                className={`font-bold ${
                                    profile.isActive
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {profile.isActive ? "Active" : "Inactive"}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-black">
                                Verified:
                            </div>
                            <div
                                className={`font-bold ${
                                    profile.isVerified
                                        ? "text-green-600"
                                        : "text-yellow-600"
                                }`}
                            >
                                {profile.isVerified ? "Verified" : "Pending"}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Stats Data */}
            {stats && (
                <Card className="p-6 border-4 border-black shadow-[8px_8px_0_black]">
                    <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wide">
                        Payment Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#ff005c]">
                                {stats.today.transactions}
                            </div>
                            <div className="text-sm text-gray-600">Today</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#00f0ff]">
                                {stats.week.transactions}
                            </div>
                            <div className="text-sm text-gray-600">
                                This Week
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#4ade80]">
                                {stats.month.transactions}
                            </div>
                            <div className="text-sm text-gray-600">
                                This Month
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#facc15]">
                                {stats.overall.transactions}
                            </div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Transactions Data */}
            {transactions.length > 0 && (
                <Card className="p-6 border-4 border-black shadow-[8px_8px_0_black]">
                    <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wide">
                        Recent Transactions
                    </h3>
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <div
                                key={tx._id}
                                className="flex items-center justify-between p-3 border-2 border-black bg-white"
                            >
                                <div>
                                    <div className="font-bold text-black">
                                        {tx.transactionId}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {tx.amount} SUI
                                    </div>
                                </div>
                                <div
                                    className={`font-bold ${
                                        tx.status === "completed"
                                            ? "text-green-600"
                                            : tx.status === "failed"
                                            ? "text-red-600"
                                            : "text-yellow-600"
                                    }`}
                                >
                                    {tx.status.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
