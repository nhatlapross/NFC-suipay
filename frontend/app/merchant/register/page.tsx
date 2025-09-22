"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

type Period = "daily" | "weekly" | "monthly";

export default function MerchantRegisterPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [apiKeys, setApiKeys] = useState<{
        publicKey: string;
        secretKey: string;
    } | null>(null);

    // Form states
    const [merchantName, setMerchantName] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [address, setAddress] = useState({
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
    });
    const [webhookUrl, setWebhookUrl] = useState("");
    const [settlementPeriod, setSettlementPeriod] = useState<Period>("daily");

    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait for auth to finish loading before redirect decisions
        if (authLoading) return;
        if (!user || user.role !== "merchant") {
            router.replace("/auth");
            return;
        }
        // Pre-fill email and phone from user profile
        setEmail(user.email || "");
        setPhoneNumber(user.phoneNumber || "");
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/merchant/register`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        merchantName,
                        businessType,
                        email,
                        phoneNumber,
                        walletAddress,
                        address,
                        webhookUrl,
                        settlementPeriod,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setApiKeys({
                    publicKey: data.data.apiKeys.publicKey,
                    secretKey: data.data.apiKeys.secretKey,
                });

                // Store API keys in localStorage for future use
                localStorage.setItem(
                    "merchantCredentials",
                    JSON.stringify({
                        merchantId: data.data.merchantId,
                        publicKey: data.data.apiKeys.publicKey,
                        secretKey: data.data.apiKeys.secretKey,
                    })
                );
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Registration failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        router.replace("/merchant");
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff005c] mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking session...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== "merchant") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff005c] mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (success && apiKeys) {
        return (
            <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <Card className="p-8 border-4 border-black shadow-[8px_8px_0_black]">
                        <div className="text-center mb-6">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-black mb-2">
                                MERCHANT REGISTERED!
                            </h1>
                            <p className="text-gray-600">
                                Your merchant account has been created
                                successfully
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-green-50 border-2 border-green-300 rounded">
                                <h3 className="font-bold text-green-800 mb-2">
                                    API Keys Generated
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm font-bold text-green-700">
                                            Public Key:
                                        </label>
                                        <code className="text-xs bg-white p-2 border rounded block break-all">
                                            {apiKeys.publicKey}
                                        </code>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-green-700">
                                            Secret Key:
                                        </label>
                                        <code className="text-xs bg-white p-2 border rounded block break-all">
                                            {apiKeys.secretKey}
                                        </code>
                                    </div>
                                </div>
                                <p className="text-xs text-green-600 mt-2">
                                    ⚠️ Save these keys securely. You&apos;ll
                                    need them to access merchant APIs.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleContinue}
                            className="w-full bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black shadow-[4px_4px_0_black]"
                        >
                            CONTINUE TO MERCHANT DASHBOARD
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <Card className="p-8 border-4 border-black shadow-[8px_8px_0_black]">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-black mb-2">
                            MERCHANT REGISTRATION
                        </h1>
                        <p className="text-gray-600">
                            Complete your merchant account setup
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Merchant Name *
                                </label>
                                <Input
                                    value={merchantName}
                                    onChange={(e) =>
                                        setMerchantName(e.target.value)
                                    }
                                    className="border-4 border-black"
                                    placeholder="Coffee Shop ABC"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Business Type *
                                </label>
                                <Input
                                    value={businessType}
                                    onChange={(e) =>
                                        setBusinessType(e.target.value)
                                    }
                                    className="border-4 border-black"
                                    placeholder="Food & Beverage"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Email *
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-4 border-black"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Phone Number *
                                </label>
                                <Input
                                    value={phoneNumber}
                                    onChange={(e) =>
                                        setPhoneNumber(e.target.value)
                                    }
                                    className="border-4 border-black"
                                    placeholder="1234567890"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-2">
                                Wallet Address *
                            </label>
                            <Input
                                value={walletAddress}
                                onChange={(e) =>
                                    setWalletAddress(e.target.value)
                                }
                                className="border-4 border-black"
                                placeholder="0x..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Street Address *
                                </label>
                                <Input
                                    value={address.street}
                                    onChange={(e) =>
                                        setAddress({
                                            ...address,
                                            street: e.target.value,
                                        })
                                    }
                                    className="border-4 border-black"
                                    placeholder="123 Main Street"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    City *
                                </label>
                                <Input
                                    value={address.city}
                                    onChange={(e) =>
                                        setAddress({
                                            ...address,
                                            city: e.target.value,
                                        })
                                    }
                                    className="border-4 border-black"
                                    placeholder="San Francisco"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    State *
                                </label>
                                <Input
                                    value={address.state}
                                    onChange={(e) =>
                                        setAddress({
                                            ...address,
                                            state: e.target.value,
                                        })
                                    }
                                    className="border-4 border-black"
                                    placeholder="CA"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Country *
                                </label>
                                <Input
                                    value={address.country}
                                    onChange={(e) =>
                                        setAddress({
                                            ...address,
                                            country: e.target.value,
                                        })
                                    }
                                    className="border-4 border-black"
                                    placeholder="USA"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Postal Code *
                                </label>
                                <Input
                                    value={address.postalCode}
                                    onChange={(e) =>
                                        setAddress({
                                            ...address,
                                            postalCode: e.target.value,
                                        })
                                    }
                                    className="border-4 border-black"
                                    placeholder="94105"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Webhook URL
                                </label>
                                <Input
                                    value={webhookUrl}
                                    onChange={(e) =>
                                        setWebhookUrl(e.target.value)
                                    }
                                    className="border-4 border-black"
                                    placeholder="https://your-domain.com/webhook"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">
                                    Settlement Period *
                                </label>
                                <select
                                    value={settlementPeriod}
                                    onChange={(e) =>
                                        setSettlementPeriod(
                                            e.target.value as
                                                | "daily"
                                                | "weekly"
                                                | "monthly"
                                        )
                                    }
                                    className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:shadow-brutal"
                                    required
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black shadow-[4px_4px_0_black]"
                        >
                            {loading ? "REGISTERING..." : "REGISTER MERCHANT"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
