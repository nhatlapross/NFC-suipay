"use client";

import { useEffect, useState } from "react";
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
    Wifi,
    Pin,
    Key,
    LockKeyhole,
} from "lucide-react";
import {
    PaymentState,
    StateData,
    NDEFMessage,
    NDEFRecord,
    PaymentResult,
    PosSessionResult,
} from "./types";

function getStateData(state: PaymentState, amount: string): StateData {
    switch (state) {
        case "ready":
            return {
                amount: amount,
                amountBg: "bg-[#ffffff]",
                icon: <CreditCard className="w-16 h-16 text-[#000000]" />,
                title: "READY FOR NFC PAYMENT",
                description: "",
                showButton: true,
                buttonText: "START NFC PAYMENT",
                buttonColor: "bg-[#ff005c]",
                showCancel: false,
                showNewPayment: false,
            };
        case "tap":
            return {
                amount: amount,
                amountBg: "bg-[#00f0ff]",
                icon: <Wifi className="w-16 h-16 text-[#00f0ff]" />,
                title: "TAP YOUR CARD OR DEVICE",
                description:
                    "Hold your NFC-enabled card or device near the terminal",
                showButton: false,
                showCancel: true,
                showNewPayment: false,
            };
        case "pin":
            return {
                amount: amount,
                amountBg: "bg-[#00f0ff]",
                icon: <LockKeyhole className="w-16 h-16 text-[#eab308]" />,
                title: "",
                description: "Enter your pin",
                showButton: false,
                showCancel: false,
                showNewPayment: false,
            };
        case "processing":
            return {
                amount: amount,
                amountBg: "bg-[#00f0ff]",
                icon: (
                    <Loader2 className="w-16 h-16 text-[#eab308] animate-spin" />
                ),
                title: "PROCESSING PAYMENT...",
                description: "Please wait while we process your payment...",
                showButton: false,
                showCancel: false,
                showNewPayment: false,
            };
        case "success":
            return {
                amount: amount,
                amountBg: "bg-[#ffffff]",
                icon: <CheckCircle className="w-16 h-16 text-[#22c55e]" />,
                title: "PAYMENT SUCCESSFUL!",
                description: "",
                showButton: false,
                showCancel: false,
                showNewPayment: true,
                transactionId: "TXN_1727831116091",
                transactionAmount: "10 SUI",
            };
        case "failed":
            return {
                amount: amount,
                amountBg: "bg-[#ffffff]",
                icon: <XCircle className="w-16 h-16 text-[#ff005c]" />,
                title: "PAYMENT FAILED",
                description:
                    "Please try again or use a different payment method",
                showButton: false,
                showCancel: false,
                showNewPayment: true,
            };
    }
}

export default function NFCTerminal() {
    const [currentState, setCurrentState] = useState<PaymentState>("ready");
    const [amount, setAmount] = useState("0.00");
    const [description, setDescription] = useState<string>("");
    const [pin, setPin] = useState("");
    const [cardUuid, setCardUuid] = useState("");
    const [serverStatus, setServerStatus] = useState<
        "unknown" | "online" | "offline"
    >("unknown");
    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
    const [posSession, setPosSession] = useState<PosSessionResult | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
        null
    );

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Get the value from the input field
        const value = e.target.value;
        // Basic validation to only allow numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const data = getStateData(currentState, amount);

    // Check server health and NFC support on load
    useEffect(() => {
        checkServerHealth();
        checkNFCSupport();
    }, []);

    const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        `http://${window.location.hostname}:8080`;

    const checkServerHealth = async () => {
        try {
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
        if (!nfcSupported) return;

        setCurrentState("tap");

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

                    console.log(
                        "🚀 Initiating payment with detected UUID:",
                        detectedUuid
                    );

                    // Auto-initiate payment after NFC detection
                    await initiatePaymentWithNFC(detectedUuid);
                }
            );
        } catch (error) {
            console.error("NFC Error:", error);
            alert(
                `NFC Error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
            setCurrentState("ready");
        }
    };

    const initiatePaymentWithNFC = async (uuid: string) => {
        setPosSession(null);
        setPaymentResult(null);

        try {
            const res = await fetch(`${backendUrl}/api/pos/initiate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cardUuid: uuid,
                    amount: parseFloat(amount),
                    merchantId: "mch_593200537dff4e71",
                    terminalId: "MAIN_COUNTER_01",
                    description: "NFC Payment",
                }),
            });

            const data: PosSessionResult = await res.json();
            setPosSession(data);

            if (data.success) {
                setCardUuid(uuid);
                setCurrentState("pin");
            } else {
                console.error("POS initiation failed:", data.error);
                setCurrentState("failed");
            }
        } catch (err) {
            console.error("Backend error during initiate:", err);
            setPosSession({ success: false, error: "Backend error" });
            setCurrentState("failed");
        }
    };

    const processPayment = async () => {
        setCurrentState("processing");
        try {
            const res = await fetch(
                `${backendUrl}/api/payment/process-direct`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cardUuid,
                        amount: parseFloat(amount),
                        merchantId: "mch_593200537dff4e71",
                        terminalId: "TERM_01",
                        pin,
                    }),
                }
            );
            const data: PaymentResult = await res.json();
            setPaymentResult(data);

            if (data.success) setCurrentState("success");
            else setCurrentState("failed");
        } catch (e) {
            setPaymentResult({
                success: false,
                error: "Network error",
            });
            setCurrentState("failed");
        }
    };

    const resetTerminal = () => {
        setCurrentState("ready");
        setPosSession(null);
        setPaymentResult(null);
        setPin("");
        setCardUuid("");
        setAmount("0.00");
    };

    return (
        <div className="max-w-3xl mx-auto px-8 py-8">
            {/* NFC Payment Section */}
            <Card className="p-4 border-4 border-[#000000] shadow-[8px_8px_0_black]">
                <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-bold text-sm">NFC PAYMENT</span>
                </div>
                <p className="text-xs text-[#757575]">
                    Accept contactless payments via NFC-enabled cards and
                    devices
                </p>
            </Card>

            {/* Payment Amount */}
            <Card className="p-4 border-4 border-[#000000] shadow-[8px_8px_0_black] mt-4">
                <div className="mb-4">
                    <div className="mb-2">
                        <span className="font-bold text-sm">
                            PAYMENT AMOUNT
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Input
                            value={data.amount}
                            onChange={changeHandler}
                            // Input is only editable in the "ready" state
                            readOnly={currentState !== "ready"}
                            disabled={currentState !== "ready"}
                            className={`${data.amountBg} border-2 border-[#000000] font-mono text-lg font-bold text-center`}
                        />
                        <span className="font-bold">SUI</span>
                    </div>
                </div>
                <div>
                    <div className="font-bold text-sm mb-2 tracking-wide">
                        DESCRIPTION (OPTIONAL)
                    </div>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Coffee and pastry"
                        className={`${data.amountBg} border-2 border-[#000000] font-mono text-lg text-center`}
                    />
                </div>
            </Card>

            {/* Main Status Area */}
            <Card className="p-10 border-4 border-[#000000] shadow-[8px_8px_0_black] min-h-[260px] flex flex-col items-center justify-center text-center mt-4">
                <div className="mb-6">{data.icon}</div>
                <h3 className="font-bold text-xl mb-6">{data.title}</h3>
                {data.description && (
                    <p className="text-sm text-[#757575] mb-4">
                        {data.description}
                    </p>
                )}
                {currentState === "tap" && (
                    <Badge
                        variant={
                            serverStatus === "online"
                                ? "default"
                                : "destructive"
                        }
                    >
                        Status:{" "}
                        {serverStatus === "online" ? "Ready" : "Not Ready"}
                    </Badge>
                )}

                {currentState === "pin" && (
                    <div className="flex flex-col items-center space-y-2 w-full">
                        <Input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="max-w-20 border-2 border-black"
                        />
                        <Button
                            className="bg-[#22c55e] text-white font-bold py-2 hover:opacity-90 max-w-20 border-4 border-black"
                            onClick={processPayment}
                            disabled={!pin}
                        >
                            Confirm
                        </Button>
                    </div>
                )}

                {currentState === "processing" && (
                    <div className="w-full bg-[#e5e7eb] rounded-full h-2 mt-4">
                        <div className="bg-[#00f0ff] h-2 rounded-full w-3/4"></div>
                    </div>
                )}

                {currentState === "success" && (
                    <Card className="bg-[#dcfce7] border-[#166534] border-4 p-4 mt-4 shadow-[6px_6px_0_black]">
                        <div className="text-sm space-y-2">
                            <div className="font-bold text-[#166534]">
                                TRANSACTION COMPLETED
                            </div>
                            <div className="text-[#15803d]">
                                ID:{" "}
                                {paymentResult?.transaction?.transactionId ||
                                    data.transactionId}
                            </div>
                            <div className="text-[#15803d]">
                                Amount:{" "}
                                {paymentResult?.transaction?.amount ||
                                    data.amount}
                            </div>

                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
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
                    </Card>
                )}

                {/* {currentState === "failed" && (
                    <Card className="bg-red-50 border-red-300 border-4 p-4 mt-4 shadow-[6px_6px_0_black]">
                        <div className="text-sm">
                            <div className="font-bold text-red-700">
                                TRANSACTION FAILED
                            </div>
                            <div className="text-red-600">
                                {paymentResult?.message || data.description}
                            </div>
                        </div>
                    </Card>
                )} */}

                {currentState === "failed" && (
                    <Card className="bg-red-50 border-red-300 border-4 p-4 mt-4 shadow-[6px_6px_0_black]">
                        <div className="text-sm space-y-1">
                            <div className="font-bold text-red-700">
                                TRANSACTION FAILED
                            </div>
                            <div className="text-red-600">
                                {paymentResult?.message ||
                                    paymentResult?.error ||
                                    "Unknown error"}
                            </div>

                            {/* Show thêm chi tiết lỗi nếu có */}
                            {paymentResult?.code && (
                                <div className="text-xs text-red-500">
                                    Code: {paymentResult.code}
                                </div>
                            )}
                            {paymentResult?.transaction && (
                                <div className="text-xs text-red-500">
                                    Status: {paymentResult.transaction.status}
                                </div>
                            )}

                            {/* Debug JSON */}
                            <pre className="text-xs bg-white border border-red-200 rounded p-2 overflow-x-auto">
                                {JSON.stringify(paymentResult, null, 2)}
                            </pre>
                        </div>
                    </Card>
                )}
            </Card>

            {/* Action Buttons */}
            {data.showButton && (
                <div className="mt-4 flex justify-center">
                    <Button
                        className={`${data.buttonColor} text-white font-bold py-3 hover:opacity-90 w-full max-w-xs border-4 border-black`}
                        onClick={() => scanRealNFCCard()}
                    >
                        {data.buttonText}
                    </Button>
                </div>
            )}

            {data.showCancel && (
                <div className="mt-4 flex justify-center">
                    <Button
                        className="bg-[#ff005c] text-white font-bold py-3 hover:opacity-90 border-4 border-black"
                        onClick={resetTerminal}
                    >
                        CANCEL
                    </Button>
                </div>
            )}

            {data.showNewPayment && (
                <div className="mt-4 flex justify-center">
                    <Button
                        className="bg-[#00f0ff] text-[#000000] font-bold py-3 hover:opacity-90 border-4 border-black"
                        onClick={resetTerminal}
                    >
                        NEW PAYMENT
                    </Button>
                </div>
            )}

            {/* Instructions */}
            <Card className="p-4 border-4 border-[#000000] shadow-[8px_8px_0_black] mt-4">
                <h4 className="font-bold text-sm mb-3">
                    NFC PAYMENT INSTRUCTIONS
                </h4>
                <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            1
                        </div>
                        <span className="text-xs">
                            Enter the payment amount in SUI
                        </span>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-[rgb(255,0,92)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            2
                        </div>
                        <span className="text-xs">
                            Click &quot;START NFC PAYMENT&quot; to activate the
                            terminal
                        </span>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            3
                        </div>
                        <span className="text-xs">
                            Ask customer to tap their NFC-enabled card or device
                        </span>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-[#ff005c] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            4
                        </div>
                        <span className="text-xs">
                            Wait for payment confirmation
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
