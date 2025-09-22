"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Nfc,
    CreditCard,
    CheckCircle,
    XCircle,
    ExternalLink,
} from "lucide-react";

// Test data from backend report
const TEST_DATA = {
    cardUuid: "0ee8b0b0-ba0a-420f-bb45-947822ce14b3",
    merchantId: "mch_593200537dff4e71",
    terminalId: "MAIN_COUNTER_01",
    pin: "1234",
    customerEmail: "customer@test.com",
    walletAddress:
        "0x5f4da6e4b9b992e02a21f66381f6468cea1b6664ec25518b1fcbcae236bddca8",
};

// Minimal Web NFC type declarations
interface NDEFMessage {
    records: NDEFRecord[];
}

interface NDEFRecord {
    recordType: string;
    mediaType?: string;
    data: BufferSource;
}

interface PaymentResult {
    success: boolean;
    message?: string;
    transaction?: {
        transactionId: string;
        txHash: string;
        amount: number;
        gasFee: number;
        totalAmount: number;
        status: string;
        explorerUrl: string;
    };
    error?: string;
    code?: string;
}

interface PosSessionResult {
    success: boolean;
    sessionId?: string;
    displayData?: {
        cardHolder: string;
        cardNumber: string;
        amount: string;
        merchantName: string;
        terminalName: string;
        authMethods: string[];
        sessionTimeout: number;
    };
    authRequired?: string[];
    validUntil?: string;
    error?: string;
}

export default function TestPaymentPage() {
    const [amount, setAmount] = useState("0.05");
    const [pin, setPin] = useState(TEST_DATA.pin);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
        null
    );
    const [posSession, setPosSession] = useState<PosSessionResult | null>(null);
    const [step, setStep] = useState<
        "idle" | "nfc-tap" | "pin-entry" | "processing" | "completed"
    >("idle");
    const [serverStatus, setServerStatus] = useState<
        "unknown" | "online" | "offline"
    >("unknown");
    const [cardUuid, setCardUuid] = useState(TEST_DATA.cardUuid);
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isWriting, setIsWriting] = useState(false);

    // Check server health and NFC support on load
    useEffect(() => {
        checkServerHealth();
        checkNFCSupport();
    }, []);

    const checkServerHealth = async () => {
        try {
            // Try to get the backend URL from environment or use current host
            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL ||
                `http://${window.location.hostname}:8080`;

            console.log("Checking backend health at:", backendUrl);
            const response = await fetch(`${backendUrl}/health`);
            if (response.ok) {
                setServerStatus("online");
                console.log("✅ Backend is online");
            } else {
                setServerStatus("offline");
                console.log("❌ Backend responded with error");
            }
        } catch (error) {
            setServerStatus("offline");
            console.log("❌ Backend connection failed:", error);
        }
    };

    const checkNFCSupport = async () => {
        if ("NDEFReader" in window) {
            setNfcSupported(true);
            console.log("✅ Web NFC API is supported");
        } else {
            setNfcSupported(false);
            console.log("❌ Web NFC API is not supported");
        }
    };

    const scanRealNFCCard = async () => {
        if (!nfcSupported) {
            alert("NFC not supported on this device/browser");
            return;
        }

        setIsScanning(true);

        try {
            // @ts-expect-error - Web NFC API types are not yet in TypeScript
            const reader = new NDEFReader();

            console.log("🔍 Starting NFC scan...");

            // Start scanning
            await reader.scan();

            // Listen for NFC tags
            reader.addEventListener(
                "reading",
                async (event: {
                    message: NDEFMessage;
                    serialNumber: string;
                }) => {
                    const { message, serialNumber } = event;

                    console.log("📱 NFC card detected!");
                    console.log("Serial Number:", serialNumber);

                    // Use serial number as UUID
                    let detectedUuid = serialNumber || `nfc-${Date.now()}`;

                    // Read NDEF messages if any
                    for (const record of message.records) {
                        console.log("Record type:", record.recordType);
                        console.log("Media type:", record.mediaType);
                        const data = new TextDecoder().decode(record.data);
                        console.log("Data:", data);

                        // If we find text data that looks like a UUID, use it instead of serial number
                        if (
                            record.recordType === "text" &&
                            data.includes("-") &&
                            data.length > 30
                        ) {
                            console.log(
                                "Found UUID in NDEF text record:",
                                data
                            );
                            detectedUuid = data;
                            break;
                        }
                    }

                    // Set the detected UUID
                    setCardUuid(detectedUuid);
                    setIsScanning(false);

                    console.log(
                        "🚀 Auto-initiating payment with detected UUID:",
                        detectedUuid
                    );

                    // Auto-initiate payment after NFC detection
                    await initiatePaymentWithNFC(detectedUuid);
                }
            );

            reader.addEventListener("readingerror", () => {
                console.log(
                    "❌ Cannot read data from the NFC tag. Try another one?"
                );
                alert("Cannot read NFC tag. Try again.");
                setIsScanning(false);
            });

            // Auto-stop scanning after 30 seconds
            setTimeout(() => {
                if (isScanning) {
                    console.log("⏰ NFC scan timeout");
                    setIsScanning(false);
                }
            }, 30000);
        } catch (error) {
            console.error("NFC Error:", error);
            alert(
                `NFC Error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
            setIsScanning(false);
        }
    };

    const stopNFCScanning = () => {
        setIsScanning(false);
        console.log("🛑 NFC scanning stopped");
    };

    const writeUUIDToNFC = async () => {
        if (!nfcSupported) {
            alert("NFC not supported on this device/browser");
            return;
        }

        if (!cardUuid.trim()) {
            alert("Please enter a UUID to write to the card");
            return;
        }

        setIsWriting(true);

        try {
            // @ts-expect-error - Web NFC API types are not yet in TypeScript
            const writer = new NDEFReader();

            console.log("📝 Starting NFC write...");
            console.log("UUID to write:", cardUuid);

            // Prepare NDEF message with UUID
            const message = {
                records: [
                    {
                        recordType: "text",
                        data: cardUuid,
                    },
                    {
                        recordType: "url",
                        data: `https://nfc-payment.app/card/${cardUuid}`,
                    },
                ],
            };

            // Write to NFC tag
            await writer.write(message);

            console.log("✅ UUID written to NFC card successfully");
            alert(
                `UUID written to NFC card successfully!\n\nUUID: ${cardUuid}\n\nYou can now scan this card to test payments.`
            );
        } catch (error) {
            console.error("NFC Write Error:", error);
            if (error instanceof Error) {
                if (error.name === "NotAllowedError") {
                    alert(
                        "NFC write permission denied. Please allow NFC access and try again."
                    );
                } else if (error.name === "NetworkError") {
                    alert(
                        "NFC write failed. Make sure the NFC tag is writable and try again."
                    );
                } else {
                    alert(`NFC Write Error: ${error.message}`);
                }
            } else {
                alert("NFC write failed. Please try again.");
            }
        } finally {
            setIsWriting(false);
        }
    };

    const initiatePaymentWithNFC = async (detectedUuid: string) => {
        setStep("nfc-tap");
        setIsProcessing(true);
        setPosSession(null);
        setPaymentResult(null);

        try {
            console.log(
                "💳 Initiating payment with NFC card UUID:",
                detectedUuid
            );

            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL ||
                `http://${window.location.hostname}:8080`;

            const response = await fetch(`${backendUrl}/api/pos/initiate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cardUuid: detectedUuid,
                    amount: parseFloat(amount),
                    merchantId: TEST_DATA.merchantId,
                    terminalId: TEST_DATA.terminalId,
                    description: "NFC Payment",
                }),
            });

            const data: PosSessionResult = await response.json();
            setPosSession(data);

            if (data.success) {
                console.log("✅ Payment session created, showing PIN entry");
                setStep("pin-entry");
            } else {
                console.log("❌ Payment session failed:", data.error);
                setStep("completed");
            }
        } catch (error) {
            console.error("Payment initiation error:", error);
            setPosSession({
                success: false,
                error: `Connection error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            });
            setStep("completed");
        } finally {
            setIsProcessing(false);
        }
    };

    const simulateNFCTap = async () => {
        await initiatePaymentWithNFC(cardUuid);
    };

    const processPayment = async () => {
        setStep("processing");
        setIsProcessing(true);
        setPaymentResult(null);

        try {
            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL ||
                `http://${window.location.hostname}:8080`;

            const response = await fetch(
                `${backendUrl}/api/payment/process-direct`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cardUuid: cardUuid,
                        amount: parseFloat(amount),
                        merchantId: TEST_DATA.merchantId,
                        terminalId: TEST_DATA.terminalId,
                        pin: pin,
                    }),
                }
            );

            const data: PaymentResult = await response.json();
            setPaymentResult(data);
            setStep("completed");
        } catch (error) {
            setPaymentResult({
                success: false,
                error: `Connection error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            });
            setStep("completed");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTest = () => {
        setStep("idle");
        setPosSession(null);
        setPaymentResult(null);
        setIsProcessing(false);
    };

    const getStepIcon = (currentStep: string) => {
        if (step === currentStep && isProcessing) {
            return <Loader2 className="h-4 w-4 animate-spin" />;
        }
        switch (currentStep) {
            case "nfc-tap":
                return (
                    <Nfc
                        className={`h-4 w-4 ${
                            step === "nfc-tap"
                                ? "text-blue-500"
                                : "text-gray-400"
                        }`}
                    />
                );
            case "pin-entry":
                return (
                    <CreditCard
                        className={`h-4 w-4 ${
                            step === "pin-entry"
                                ? "text-blue-500"
                                : "text-gray-400"
                        }`}
                    />
                );
            case "processing":
                return step === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : (
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">
                    NFC Payment Test Page
                </h1>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={
                            serverStatus === "online"
                                ? "default"
                                : "destructive"
                        }
                    >
                        Backend: {serverStatus}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={checkServerHealth}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="amount">Amount (SUI)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={step !== "idle"}
                            />
                        </div>
                        <div>
                            <Label htmlFor="pin">PIN (4 digits)</Label>
                            <Input
                                id="pin"
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) =>
                                    setPin(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 4)
                                    )
                                }
                                disabled={step === "processing"}
                            />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="cardUuid">Card UUID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="cardUuid"
                                        value={cardUuid}
                                        onChange={(e) =>
                                            setCardUuid(e.target.value)
                                        }
                                        disabled={step !== "idle"}
                                        className="font-mono text-xs"
                                        placeholder="Card UUID from NFC scan"
                                    />
                                    {nfcSupported && (
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={scanRealNFCCard}
                                                disabled={
                                                    isScanning ||
                                                    isWriting ||
                                                    step !== "idle"
                                                }
                                                className="whitespace-nowrap"
                                            >
                                                {isScanning ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Scanning...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Nfc className="h-3 w-3 mr-1" />
                                                        Scan
                                                    </>
                                                )}
                                            </Button>
                                            {isScanning && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={stopNFCScanning}
                                                    className="whitespace-nowrap"
                                                >
                                                    Stop
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant={
                                            nfcSupported
                                                ? "default"
                                                : "secondary"
                                        }
                                        className="text-xs"
                                    >
                                        NFC:{" "}
                                        {nfcSupported === null
                                            ? "Checking..."
                                            : nfcSupported
                                            ? "Supported"
                                            : "Not Supported"}
                                    </Badge>
                                    {!nfcSupported && nfcSupported !== null && (
                                        <span className="text-xs text-gray-500">
                                            Use manual UUID entry
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <strong>Merchant:</strong>{" "}
                                    {TEST_DATA.merchantId}
                                </p>
                                <p>
                                    <strong>Terminal:</strong>{" "}
                                    {TEST_DATA.terminalId}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Flow */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Step 1: NFC Detection */}
                        <div
                            className={`flex items-center gap-3 p-3 rounded ${
                                step === "nfc-tap"
                                    ? "bg-blue-50 border border-blue-200"
                                    : ""
                            }`}
                        >
                            {getStepIcon("nfc-tap")}
                            <span>1. NFC Card Detection & Payment Init</span>
                            {step === "idle" && (
                                <div className="ml-auto flex gap-2">
                                    {nfcSupported && (
                                        <Button
                                            onClick={scanRealNFCCard}
                                            disabled={
                                                isScanning ||
                                                serverStatus !== "online"
                                            }
                                            variant="default"
                                        >
                                            {isScanning ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Scanning...
                                                </>
                                            ) : (
                                                <>
                                                    <Nfc className="h-4 w-4 mr-2" />
                                                    Scan NFC
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={simulateNFCTap}
                                        disabled={serverStatus !== "online"}
                                        variant="outline"
                                    >
                                        Manual Test
                                    </Button>
                                </div>
                            )}
                            {step === "nfc-tap" && isProcessing && (
                                <div className="ml-auto text-sm text-blue-600">
                                    Creating payment session...
                                </div>
                            )}
                        </div>

                        {/* Step 2: PIN Entry */}
                        <div
                            className={`flex items-center gap-3 p-3 rounded ${
                                step === "pin-entry"
                                    ? "bg-blue-50 border border-blue-200"
                                    : ""
                            }`}
                        >
                            {getStepIcon("pin-entry")}
                            <span>2. PIN Authentication</span>
                            {step === "pin-entry" && (
                                <Button
                                    onClick={processPayment}
                                    disabled={!pin || pin.length !== 4}
                                    className="ml-auto"
                                >
                                    Enter PIN
                                </Button>
                            )}
                        </div>

                        {/* Step 3: Processing */}
                        <div
                            className={`flex items-center gap-3 p-3 rounded ${
                                step === "processing"
                                    ? "bg-blue-50 border border-blue-200"
                                    : ""
                            }`}
                        >
                            {getStepIcon("processing")}
                            <span>3. Payment Processing</span>
                        </div>

                        {step !== "idle" && (
                            <Button
                                variant="outline"
                                onClick={resetTest}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                Reset Test
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* POS Session Result */}
            {posSession && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            NFC Session Result
                            {posSession.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {posSession.success ? (
                            <div className="space-y-2 text-sm">
                                <p>
                                    <strong>Session ID:</strong>{" "}
                                    {posSession.sessionId}
                                </p>
                                {posSession.displayData && (
                                    <>
                                        <p>
                                            <strong>Card Holder:</strong>{" "}
                                            {posSession.displayData.cardHolder}
                                        </p>
                                        <p>
                                            <strong>Amount:</strong>{" "}
                                            {posSession.displayData.amount}
                                        </p>
                                        <p>
                                            <strong>Merchant:</strong>{" "}
                                            {
                                                posSession.displayData
                                                    .merchantName
                                            }
                                        </p>
                                        <p>
                                            <strong>Terminal:</strong>{" "}
                                            {
                                                posSession.displayData
                                                    .terminalName
                                            }
                                        </p>
                                        <p>
                                            <strong>Auth Required:</strong>{" "}
                                            {posSession.authRequired?.join(
                                                ", "
                                            )}
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Alert>
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {posSession.error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Payment Result */}
            {paymentResult && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Payment Result
                            {paymentResult.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentResult.success && paymentResult.transaction ? (
                            <div className="space-y-3">
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription className="text-green-700">
                                        {paymentResult.message}
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p>
                                            <strong>Transaction ID:</strong>
                                        </p>
                                        <p className="font-mono text-xs break-all">
                                            {
                                                paymentResult.transaction
                                                    .transactionId
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p>
                                            <strong>Amount:</strong>{" "}
                                            {paymentResult.transaction.amount}{" "}
                                            SUI
                                        </p>
                                        <p>
                                            <strong>Gas Fee:</strong>{" "}
                                            {paymentResult.transaction.gasFee}{" "}
                                            SUI
                                        </p>
                                        <p>
                                            <strong>Total:</strong>{" "}
                                            {
                                                paymentResult.transaction
                                                    .totalAmount
                                            }{" "}
                                            SUI
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p>
                                        <strong>Blockchain Hash:</strong>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="text-xs bg-gray-100 p-1 rounded break-all">
                                            {paymentResult.transaction.txHash}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                window.open(
                                                    paymentResult.transaction
                                                        ?.explorerUrl,
                                                    "_blank"
                                                )
                                            }
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </div>

                                <Badge className="bg-green-100 text-green-800">
                                    Status: {paymentResult.transaction.status}
                                </Badge>
                            </div>
                        ) : (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {paymentResult.error || "Payment failed"}
                                    {paymentResult.code &&
                                        ` (${paymentResult.code})`}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* NFC Testing Section */}
            {nfcSupported && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Nfc className="h-5 w-5" />
                            NFC Card Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Write UUID to NFC Card */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-green-900">
                                        Write UUID to NFC Card
                                    </h4>
                                    <Button
                                        onClick={writeUUIDToNFC}
                                        disabled={
                                            isWriting ||
                                            isScanning ||
                                            !cardUuid.trim()
                                        }
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isWriting ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Writing...
                                            </>
                                        ) : (
                                            <>📝 Write UUID</>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-sm text-green-800 mb-2">
                                    Ghi UUID vào NFC card để tạo test card:
                                </p>
                                <ol className="text-sm text-green-800 space-y-1">
                                    <li>
                                        1. Nhập hoặc để UUID mặc định ở trên
                                    </li>
                                    <li>
                                        2. Click &quot;Write UUID&quot; và đặt
                                        NFC card gần thiết bị
                                    </li>
                                    <li>
                                        3. UUID sẽ được ghi vào card với NDEF
                                        format
                                    </li>
                                    <li>
                                        4. Sau đó có thể scan card để test
                                        payment
                                    </li>
                                </ol>
                            </div>

                            {/* Read from NFC Card */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">
                                    NFC Payment Flow
                                </h4>
                                <p className="text-sm text-blue-800 mb-2">
                                    Thanh toán tự động sau khi detect NFC:
                                </p>
                                <ol className="text-sm text-blue-800 space-y-1">
                                    <li>
                                        1. Click &quot;Scan&quot; button ở trên
                                    </li>
                                    <li>2. Đặt NFC card gần thiết bị</li>
                                    <li>
                                        3. Hệ thống tự động tạo payment session
                                    </li>
                                    <li>
                                        4. Màn hình PIN entry sẽ hiện ra ngay
                                        lập tức
                                    </li>
                                    <li>
                                        5. Nhập PIN và hoàn thành thanh toán
                                    </li>
                                </ol>
                            </div>

                            {isScanning && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-yellow-800">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="font-medium">
                                            NFC Scanning Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Đặt NFC card gần thiết bị...
                                    </p>
                                </div>
                            )}

                            {isWriting && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-purple-800">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="font-medium">
                                            NFC Writing Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-purple-700 mt-1">
                                        Đang ghi UUID vào NFC card. Đặt card gần
                                        thiết bị...
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Test Scenarios */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Test Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAmount("0.05");
                                setPin("1234");
                                setCardUuid(TEST_DATA.cardUuid);
                                resetTest();
                            }}
                        >
                            Valid Payment
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAmount("0.05");
                                setPin("0000");
                                setCardUuid(TEST_DATA.cardUuid);
                                resetTest();
                            }}
                        >
                            Invalid PIN
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAmount("1.0");
                                setPin("1234");
                                setCardUuid(TEST_DATA.cardUuid);
                                resetTest();
                            }}
                        >
                            High Amount
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
