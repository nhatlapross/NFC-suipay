"use client";
import React, { useEffect, useState } from "react";
import {
    Nfc,
    Eye,
    EyeOff,
    Zap,
    Loader2,
    QrCode,
    X,
    CheckCircle,
    XCircle,
    ExternalLink,
} from "lucide-react";
import {
    Scanner,
    useDevices,
    IDetectedBarcode,
} from "@yudiel/react-qr-scanner";
import Image from "next/image";
import { Card, User } from "@/types";
import {
    getUserCardsAPI,
    getUserProfileAPI,
    getWalletBalanceAPI,
} from "@/lib/api-client";
import { AxiosError } from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { formatAddress } from "@/lib/utils";
import { Button } from "../ui/button";
import { PaymentResult } from "../merchant/nfc/types";

interface QrPayload {
    requestId: string;
    amount: number;
    merchantId: string;
    currency: string;
    description?: string;
}

interface HomeScreenProps {
    showBalance: boolean;
    onToggleBalance: () => void;
    card?: Card | null;
}

// Define payment flow steps
enum PaymentStep {
    SCANNING = "scanning",
    PAYMENT_DETAILS = "payment_details",
    PROCESSING = "processing",
    RESULT = "result",
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    showBalance,
    onToggleBalance,
    card,
}) => {
    const { user } = useAuth();
    const address = user?.walletAddress;
    const [userProfile, setUserProfile] = useState<User>();
    const [userCards, setUserCards] = useState<Card[]>([]);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // QR Payment Flow State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<PaymentStep>(
        PaymentStep.SCANNING
    );
    const [qrPayload, setQrPayload] = useState<QrPayload | null>(null);
    const [pin, setPin] = useState("");
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
        null
    );
    const [scanError, setScanError] = useState<string>("");

    const devices = useDevices();

    // Start QR payment flow
    const startQRPayment = () => {
        setIsPaymentModalOpen(true);
        setCurrentStep(PaymentStep.SCANNING);
        setQrPayload(null);
        setPin("");
        setPaymentResult(null);
        setScanError("");
        console.log("📷 Starting QR payment flow...");
    };

    // Close payment modal and reset state
    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setCurrentStep(PaymentStep.SCANNING);
        setQrPayload(null);
        setPin("");
        setPaymentResult(null);
        setScanError("");
        console.log("🛑 QR payment flow closed");
    };

    // Handle QR scan success
    const handleQRScan = (result: IDetectedBarcode[]) => {
        if (result && result[0]?.rawValue) {
            console.log("📱 QR Code detected:", result[0].rawValue);

            try {
                const scannedPayload: QrPayload = JSON.parse(
                    result[0].rawValue
                );

                // Validate required fields
                if (
                    !scannedPayload.requestId ||
                    !scannedPayload.amount ||
                    !scannedPayload.merchantId
                ) {
                    throw new Error("Missing required payment information");
                }

                setQrPayload(scannedPayload);
                setCurrentStep(PaymentStep.PAYMENT_DETAILS);
                setScanError("");
                console.log("✅ QR data parsed, moving to payment details");
            } catch (error) {
                console.error("❌ Failed to parse QR data:", error);
                setScanError("Invalid QR code format. Please try again.");
            }
        }
    };

    // Handle QR scan error
    const handleQRError = (err: unknown) => {
        console.error("QR Scanner error:", err);
        setScanError("Scanner error occurred. Please try again.");
    };

    // Go back to scanning step
    const backToScanning = () => {
        setCurrentStep(PaymentStep.SCANNING);
        setQrPayload(null);
        setPin("");
        setScanError("");
    };

    // Process payment
    const handlePaymentConfirm = async () => {
        if (!qrPayload || !pin) {
            alert("Please enter your PIN");
            return;
        }

        setCurrentStep(PaymentStep.PROCESSING);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/process-direct`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cardUuid: userCards[0].cardUuid,
                        amount: qrPayload.amount,
                        merchantId: qrPayload.merchantId,
                        terminalId: qrPayload.merchantId,
                        pin: pin,
                        requestId: qrPayload.requestId,
                    }),
                }
            );

            const data: PaymentResult = await response.json();
            console.log("Payment response:", data);

            setPaymentResult(data);
            setCurrentStep(PaymentStep.RESULT);

            // Update wallet balance if payment successful
            if (data.success && address) {
                try {
                    const balanceResponse = await getWalletBalanceAPI(address);
                    if (balanceResponse.success) {
                        setWalletBalance(balanceResponse.balance);
                    }
                } catch (balanceError) {
                    console.warn("Failed to refresh balance:", balanceError);
                }
            }
        } catch (error) {
            console.error("Payment failed:", error);
            setPaymentResult({
                success: false,
                message: "Payment failed. Please try again.",
            });
            setCurrentStep(PaymentStep.RESULT);
        }
    };

    // Render QR Scanner step
    const renderScanningStep = () => (
        <>
            <div className="aspect-square w-full max-w-sm mx-auto mb-4 rounded-lg overflow-hidden">
                <Scanner
                    onScan={handleQRScan}
                    onError={handleQRError}
                    formats={["qr_code"]}
                    allowMultiple={false}
                    scanDelay={500}
                    styles={{
                        container: {
                            width: "100%",
                            height: "100%",
                        },
                    }}
                />
            </div>

            {/* Scanner Status */}
            <div className="bg-neo-black text-neo-white p-3 mb-4 text-center">
                <div className="text-sm font-mono font-bold mb-1">
                    📱 SCANNER ACTIVE
                </div>
                <div className="text-xs font-mono text-neo-cyan">
                    Position QR code within the frame
                </div>
            </div>

            {/* Scan Error */}
            {scanError && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 font-mono text-sm mb-4">
                    {scanError}
                </div>
            )}

            {/* Cancel Button */}
            <Button
                onClick={closePaymentModal}
                className="w-full bg-neo-pink border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
            >
                CANCEL
            </Button>
        </>
    );

    // Render Payment Details step
    const renderPaymentDetailsStep = () => (
        <>
            {/* Payment Information */}
            <div className="bg-neo-cyan border-2 border-neo-black p-4 mb-4">
                <h4 className="font-mono font-bold text-sm text-neo-black mb-3">
                    PAYMENT DETAILS
                </h4>
                <div className="space-y-2 font-mono text-sm text-neo-black">
                    <div className="flex justify-between">
                        <span>AMOUNT:</span>
                        <span className="font-bold text-lg">
                            ${qrPayload?.amount} {qrPayload?.currency}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>MERCHANT:</span>
                        <span className="font-bold break-all">
                            {qrPayload?.merchantId}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>REQUEST ID:</span>
                        <span className="font-bold break-all text-xs">
                            {qrPayload?.requestId}
                        </span>
                    </div>
                    {qrPayload?.description && (
                        <div className="flex justify-between">
                            <span>DESCRIPTION:</span>
                            <span className="font-bold">
                                {qrPayload.description}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* PIN Input */}
            <div className="mb-6">
                <label className="block font-mono text-sm font-bold text-neo-black mb-2">
                    ENTER PIN TO CONFIRM PAYMENT
                </label>
                <input
                    type="password"
                    value={pin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPin(e.target.value)
                    }
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full p-3 border-2 border-neo-black font-mono text-center text-lg bg-neo-white focus:outline-none focus:ring-2 focus:ring-neo-pink"
                    autoFocus
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={backToScanning}
                    className="flex-1 bg-gray-400 border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                >
                    BACK
                </Button>
                <Button
                    onClick={handlePaymentConfirm}
                    className="flex-1 bg-neo-cyan border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                    disabled={!pin || pin.length < 4}
                >
                    CONFIRM PAYMENT
                </Button>
            </div>
        </>
    );

    // Render Processing step
    const renderProcessingStep = () => (
        <>
            <div className="text-center py-8">
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-neo-pink" />
                <h4 className="font-mono font-bold text-lg text-neo-black mb-2">
                    PROCESSING PAYMENT
                </h4>
                <p className="font-mono text-sm text-neo-black">
                    Please wait while we process your transaction...
                </p>
            </div>
        </>
    );

    // Render Result step
    const renderResultStep = () => (
        <>
            <div className="text-center mb-6">
                <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        paymentResult?.success ? "bg-green-500" : "bg-red-500"
                    }`}
                >
                    {paymentResult?.success ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                        <XCircle className="w-8 h-8 text-white" />
                    )}
                </div>
                <h4 className="font-mono font-bold text-lg text-neo-black mb-2">
                    {paymentResult?.success
                        ? "PAYMENT SUCCESSFUL"
                        : "PAYMENT FAILED"}
                </h4>
                {paymentResult?.success &&
                    paymentResult.transaction?.amount && (
                        <>
                            <p className="font-mono text-2xl font-bold text-green-600 mb-2">
                                ${paymentResult.transaction.amount}{" "}
                                {qrPayload?.currency}
                            </p>
                        </>
                    )}
                <p className="font-mono text-sm text-neo-black">
                    {paymentResult?.message}
                </p>
            </div>

            {/* Success Details */}
            {paymentResult?.success && qrPayload && (
                <div className="bg-neo-cyan border-2 border-neo-black p-4 mb-4">
                    <h5 className="font-mono font-bold text-sm text-neo-black mb-2">
                        TRANSACTION DETAILS
                    </h5>
                    <div className="space-y-1 font-mono text-xs text-neo-black">
                        <div className="flex justify-between">
                            <span>MERCHANT:</span>
                            <span className="font-bold">
                                {qrPayload.merchantId}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>REQUEST ID:</span>
                            <span className="font-bold break-all">
                                {qrPayload.requestId}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>TIME:</span>
                            <span className="font-bold">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>

                        <Button
                            variant="outline"
                            className="mt-2 flex items-center gap-2 ml-auto"
                            onClick={() =>
                                window.open(
                                    `https://suiscan.xyz/testnet/tx/${paymentResult?.transaction?.txHash}`,
                                    "_blank"
                                )
                            }
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Explorer
                        </Button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                {paymentResult?.success ? (
                    <Button
                        onClick={closePaymentModal}
                        className="flex-1 bg-green-500 text-white border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                    >
                        DONE
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={closePaymentModal}
                            className="flex-1 bg-gray-400 border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                        >
                            CLOSE
                        </Button>
                        <Button
                            onClick={backToScanning}
                            className="flex-1 bg-neo-pink border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                        >
                            TRY AGAIN
                        </Button>
                    </>
                )}
            </div>
        </>
    );

    useEffect(() => {
        const loadUserData = async () => {
            try {
                setLoading(true);
                setError("");

                // Load user profile
                const profileResponse = await getUserProfileAPI();
                if (profileResponse.success && profileResponse.user) {
                    setUserProfile(profileResponse.user);
                }

                // Load user cards
                const cardsResponse = await getUserCardsAPI();
                if (cardsResponse.success && cardsResponse.data.cards) {
                    setUserCards(cardsResponse.data.cards);
                }

                // Load wallet balance
                if (address) {
                    try {
                        const balanceResponse = await getWalletBalanceAPI(
                            address
                        );
                        if (balanceResponse.success) {
                            setWalletBalance(balanceResponse.balance);
                        }
                    } catch (balanceError) {
                        console.warn(
                            "Failed to load wallet balance:",
                            balanceError
                        );
                    }
                }
            } catch (err) {
                console.error("Error loading user data:", err);
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load user data");
                }
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [address]);

    if (loading) {
        return (
            <div className="p-6 space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                        WALLET
                    </h1>
                    <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
                </div>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neo-pink" />
                        <p className="text-lg font-semibold text-neo-black">
                            Loading wallet...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    WALLET
                </h1>
                <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {/* Balance Card */}
            <div className="bg-neo-cyan border-4 border-neo-black shadow-brutal p-6">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col gap-1">
                        <p className="font-mono text-sm font-bold text-neo-black">
                            CURRENT BALANCE
                        </p>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-4xl font-mono font-bold text-neo-black">
                                {showBalance
                                    ? `$${walletBalance.toFixed(2)} SUI`
                                    : "••••••"}
                            </span>
                            <button
                                onClick={onToggleBalance}
                                className="p-2 self-end bg-neo-white border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                            >
                                {showBalance ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                    <Button
                        onClick={startQRPayment}
                        disabled={isPaymentModalOpen}
                        className="bg-neo-pink p-1 border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow"
                    >
                        <QrCode size={24} className="text-neo-white" />
                    </Button>
                </div>

                <div className="bg-neo-black text-neo-white p-3 font-mono text-xs">
                    <div>
                        ADDRESS:{" "}
                        <span className="break-all">
                            {formatAddress(address || "—")}
                        </span>
                    </div>
                    {(card || userCards.length > 0) && (
                        <div>
                            STATUS:{" "}
                            {card?.blockedAt || userCards[0]?.blockedAt
                                ? "BLOCKED"
                                : card?.isActive || userCards[0]?.isActive
                                ? "ACTIVE"
                                : "INACTIVE"}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 font-mono text-sm">
                    {error}
                </div>
            )}

            {/* Card Preview + NFC Scan */}
            <div className="space-y-4">
                {(card || userCards.length > 0) && (
                    <div className="border-4 border-neo-black shadow-brutal bg-neo-white p-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-mono text-xs font-bold text-neo-black">
                                    YOUR NFC CARD
                                </p>
                                <span
                                    className={`font-mono text-xs ${
                                        card?.blockedAt ||
                                        userCards[0]?.blockedAt
                                            ? "text-red-600"
                                            : card?.isActive ||
                                              userCards[0]?.isActive
                                            ? "text-neo-cyan"
                                            : "text-neo-pink"
                                    }`}
                                >
                                    {card?.blockedAt || userCards[0]?.blockedAt
                                        ? "BLOCKED"
                                        : card?.isActive ||
                                          userCards[0]?.isActive
                                        ? "ACTIVE"
                                        : "INACTIVE"}
                                </span>
                            </div>
                            <div className="font-mono text-sm">
                                <div>
                                    TYPE:{" "}
                                    <span className="font-bold">
                                        {card?.cardType ||
                                            userCards[0]?.cardType ||
                                            "—"}
                                    </span>
                                </div>
                                <div>
                                    UUID:{" "}
                                    <span className="break-all">
                                        {card?.cardUuid ||
                                            userCards[0]?.cardUuid ||
                                            card?.id ||
                                            userCards[0]?.id ||
                                            "—"}
                                    </span>
                                </div>
                                {typeof (
                                    card?.usageCount || userCards[0]?.usageCount
                                ) === "number" && (
                                    <div>
                                        USAGE:{" "}
                                        <span className="font-bold">
                                            {card?.usageCount ||
                                                userCards[0]?.usageCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-full">
                    <Image
                        src="/card-video.gif"
                        alt="card"
                        width={500}
                        height={500}
                        className="mx-auto rounded-2xl"
                    />
                </div>
            </div>

            {/* QR Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 h-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neo-white border-4 border-neo-black shadow-brutal max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b-2 border-neo-black sticky top-0 bg-neo-white">
                            <h3 className="font-mono font-bold text-lg text-neo-black">
                                {currentStep === PaymentStep.SCANNING &&
                                    "QR SCANNER"}
                                {currentStep === PaymentStep.PAYMENT_DETAILS &&
                                    "PAYMENT CONFIRMATION"}
                                {currentStep === PaymentStep.PROCESSING &&
                                    "PROCESSING"}
                                {currentStep === PaymentStep.RESULT &&
                                    "PAYMENT RESULT"}
                            </h3>
                            <button
                                onClick={closePaymentModal}
                                className="p-1 hover:bg-neo-pink hover:text-neo-white transition-colors"
                                disabled={
                                    currentStep === PaymentStep.PROCESSING
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4">
                            {currentStep === PaymentStep.SCANNING &&
                                renderScanningStep()}
                            {currentStep === PaymentStep.PAYMENT_DETAILS &&
                                renderPaymentDetailsStep()}
                            {currentStep === PaymentStep.PROCESSING &&
                                renderProcessingStep()}
                            {currentStep === PaymentStep.RESULT &&
                                renderResultStep()}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-4">
                    <p className="font-mono text-xs font-bold text-neo-black mb-1">
                        DAILY LIMIT
                    </p>
                    <p className="text-2xl font-mono font-bold text-neo-pink">
                        $
                        {(
                            card?.dailyLimit ||
                            userCards[0]?.dailyLimit ||
                            userProfile?.dailyLimit ||
                            0
                        ).toLocaleString()}
                    </p>
                </div>
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-4">
                    <p className="font-mono text-xs font-bold text-neo-black mb-1">
                        CARD STATUS
                    </p>
                    <p className="text-2xl font-mono font-bold text-neo-cyan">
                        {card?.blockedAt || userCards[0]?.blockedAt
                            ? "BLOCKED"
                            : card?.isActive || userCards[0]?.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}
                    </p>
                </div>
            </div>

            {/* Security Status */}
            <div className="bg-neo-black text-neo-white border-4 border-neo-black p-4">
                <h3 className="font-mono font-bold text-sm mb-3">
                    SECURITY STATUS
                </h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">OTP ENABLED</span>
                        <span
                            className={`font-mono text-xs font-bold ${
                                userProfile?.otpEnabled
                                    ? "text-neo-cyan"
                                    : "text-neo-pink"
                            }`}
                        >
                            {userProfile?.otpEnabled ? "YES" : "NO"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">2FA ENABLED</span>
                        <span
                            className={`font-mono text-xs font-bold ${
                                userProfile?.twoFactorEnabled
                                    ? "text-neo-cyan"
                                    : "text-neo-pink"
                            }`}
                        >
                            {userProfile?.twoFactorEnabled ? "YES" : "NO"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
