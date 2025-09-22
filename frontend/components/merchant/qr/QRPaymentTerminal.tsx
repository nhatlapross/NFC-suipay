"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { PaymentResult } from "../nfc/types";

interface QrPayload {
    requestId: string;
    amount: number;
    merchantId: string;
    currency: string;
    description?: string;
}

interface MerchantRequest {
    id: string;
    amount: number;
    status: string;
    qrPayload: QrPayload;
}

export default function QRPaymentTerminal() {
    const [amount, setAmount] = useState<string>("0.00");
    const [description, setDescription] = useState<string>("");
    const [isCreatingRequest, setIsCreatingRequest] = useState(false);
    const [merchantRequest, setMerchantRequest] =
        useState<MerchantRequest | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
        null
    );

    // Socket integration for real-time QR updates
    const { isConnected, qrStatus, joinQRRoom, leaveQRRoom, resetQRStatus } =
        useSocket({
            enableQRUpdates: true,
            qrRequestId: merchantRequest?.id,
        });

    // Handle QR status updates from socket
    useEffect(() => {
        if (qrStatus) {
            console.log("🔄 Received QR status update:", qrStatus);

            // Update merchant request status based on socket updates
            if (merchantRequest && qrStatus.requestId === merchantRequest.id) {
                setMerchantRequest((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: qrStatus.status,
                          }
                        : null
                );

                // Auto-complete payment result when payment is completed via socket
                if (qrStatus.status === "completed" && qrStatus.txHash) {
                    setPaymentResult({
                        success: true,
                        message:
                            "Payment completed successfully via real-time update!",
                        transaction: {
                            transactionId: qrStatus.transactionId || "",
                            txHash: qrStatus.txHash,
                            amount: qrStatus.amount || 0,
                            gasFee: qrStatus.gasFee || 0,
                            totalAmount: qrStatus.totalAmount || 0,
                            status: "completed",
                            explorerUrl: qrStatus.explorerUrl || "",
                        },
                    });
                }
            }
        }
    }, [qrStatus, merchantRequest]);

    // Join QR room when merchant request is created
    useEffect(() => {
        if (merchantRequest && isConnected) {
            console.log("📱 Joining QR room for request:", merchantRequest.id);
            joinQRRoom(merchantRequest.id);
        }
    }, [merchantRequest, isConnected, joinQRRoom]);

    const createPaymentRequest = async () => {
        setIsCreatingRequest(true);
        setMerchantRequest(null);

        try {
            const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL ||
                `http://${window.location.hostname}:8080`;

            console.log("📦 Creating payment request...");

            // Use test endpoint that doesn't require auth
            console.log("🧪 Using test endpoint...");

            const response = await fetch(
                `${backendUrl}/api/payment/test/merchant-request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                        description: description,
                    }),
                }
            );

            const responseText = await response.text();
            console.log("Create request response status:", response.status);
            console.log("Create request response text:", responseText);

            // Check if it's a validation error
            if (response.status === 400) {
                try {
                    const errorData = JSON.parse(responseText);
                    console.log(
                        "❌ Validation errors:",
                        errorData.errors || errorData.error
                    );
                    alert(
                        `Validation error: ${JSON.stringify(
                            errorData.errors || errorData.error,
                            null,
                            2
                        )}`
                    );
                    return;
                } catch (e) {
                    console.log("❌ 400 error but not JSON:", responseText);
                    alert(`400 Bad Request: ${responseText}`);
                    return;
                }
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error(
                    "Failed to parse create request response:",
                    parseError
                );
                alert(
                    `Server response error: ${responseText.slice(0, 100)}...`
                );
                return;
            }

            if (data.success) {
                setMerchantRequest(data.request);
                console.log("✅ Payment request created:", data.request);
                // Don't auto-switch tabs - let user decide
            } else {
                console.log("❌ Failed to create payment request:", data.error);
                alert(
                    `Failed to create payment request: ${
                        data.error || "Unknown error"
                    }`
                );
            }
        } catch (error) {
            console.error("Create payment request error:", error);
            alert(
                `Request creation error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsCreatingRequest(false);
        }
    };

    const generateQRCodeURL = (payload: QrPayload) => {
        const qrString = JSON.stringify({ ...payload });
        // Simple QR code generation using Google Charts API
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            qrString
        )}`;
    };

    return (
        <div className="max-w-3xl mx-auto px-8 py-8">
            {/* Header */}
            <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
                <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5" />
                    <span className="text-xl font-extrabold tracking-wide">
                        QR PAYMENT
                    </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">
                    Generate QR codes for customers to scan and pay
                </p>
            </Card>

            {/* Payment Details */}
            <Card className="mt-5 p-5 border-4 border-black shadow-[8px_8px_0_black]">
                <h3 className="text-xl font-extrabold mb-4 tracking-wide">
                    PAYMENT DETAILS
                </h3>

                <div className="mb-4">
                    <div className="font-bold text-sm mb-2 tracking-wide">
                        PAYMENT AMOUNT
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="border-4 border-black font-mono text-lg font-bold text-center"
                        />
                        <span className="font-extrabold">SUI</span>
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
                        className="border-4 border-black"
                    />
                </div>
            </Card>

            <Card className="mt-5 p-5 border-4 border-black shadow-[8px_8px_0_black]">
                <h3 className="flex items-center gap-3 text-xl font-extrabold mb-4 tracking-wide">
                    <QrCode className="h-5 w-5" />
                    QR DISPLAY
                </h3>

                <CardContent className="text-center space-y-4">
                    {merchantRequest ? (
                        <>
                            <div className="bg-white p-4 rounded-lg border inline-block">
                                <img
                                    src={generateQRCodeURL({
                                        ...merchantRequest.qrPayload,
                                    })}
                                    alt="QR Code"
                                    className="w-48 h-48 mx-auto"
                                    style={{ imageRendering: "pixelated" }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Badge
                                    variant={
                                        merchantRequest.status === "completed"
                                            ? "default"
                                            : "secondary"
                                    }
                                    className="text-lg px-4 py-2"
                                >
                                    Status: {merchantRequest.status}
                                </Badge>

                                {/* Real-time status updates from socket */}
                                {qrStatus &&
                                    qrStatus.requestId ===
                                        merchantRequest.id && (
                                        <>
                                            {qrStatus.status === "scanned" &&
                                                qrStatus.userInfo && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                                                        <p className="font-medium text-yellow-800">
                                                            📱 QR Code was
                                                            scanned!
                                                        </p>
                                                        <p className="text-yellow-700 text-xs">
                                                            Card ending in: ***
                                                            {
                                                                qrStatus
                                                                    .userInfo
                                                                    .cardLast4
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            {qrStatus.status === "completed" &&
                                                qrStatus.txHash && (
                                                    <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                                                        <p className="font-medium text-green-800">
                                                            ✅ Payment
                                                            Completed!
                                                        </p>
                                                        <p className="text-green-700 text-xs">
                                                            Amount:{" "}
                                                            {
                                                                paymentResult
                                                                    ?.transaction
                                                                    ?.amount
                                                            }{" "}
                                                            SUI
                                                        </p>
                                                        <p className="text-green-700 text-xs">
                                                            Gas:{" "}
                                                            {
                                                                paymentResult
                                                                    ?.transaction
                                                                    ?.gasFee
                                                            }{" "}
                                                            SUI
                                                        </p>

                                                        <p className="text-green-700 text-xs">
                                                            Last Update:{" "}
                                                            {new Date(
                                                                qrStatus.timestamp
                                                            ).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                )}

                                            {qrStatus.status === "failed" &&
                                                qrStatus.error && (
                                                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                                        <p className="font-medium text-red-800">
                                                            ❌ Payment Failed
                                                        </p>
                                                        <p className="text-red-700 text-xs">
                                                            {
                                                                paymentResult?.error
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                        </>
                                    )}

                                {paymentResult?.transaction?.txHash && (
                                    <Button
                                        variant="outline"
                                        className="mx-auto mt-4 flex items-center gap-2"
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
                                )}

                                <div className="mt-4 text-sm space-y-1">
                                    <p>
                                        <strong>Request ID:</strong>{" "}
                                        {merchantRequest.id}
                                    </p>
                                    {/* <p>
                                        <strong>Amount:</strong>{" "}
                                        {merchantRequest.amount} SUI
                                    </p> */}
                                    <p>
                                        <strong>Merchant ID:</strong>{" "}
                                        {merchantRequest.qrPayload.merchantId}
                                    </p>
                                    {merchantRequest.qrPayload.description && (
                                        <p>
                                            <strong>Description: </strong>{" "}
                                            {
                                                merchantRequest.qrPayload
                                                    .description
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-gray-400">
                            <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="mt-6 flex justify-center">
                <Button
                    onClick={createPaymentRequest}
                    disabled={isCreatingRequest || !amount}
                    className="w-full max-w-md h-14 bg-[#ff005c] hover:bg-[#ff005c]/90 text-white border-4 border-black text-lg font-extrabold tracking-wide"
                >
                    <div className="flex items-center justify-center gap-3">
                        <QrCode className="w-5 h-5" />
                        <span>GENERATE QR CODE</span>
                    </div>
                </Button>
            </div>

            {/* Instructions */}
            <Card className="mt-6 p-5 border-4 border-black shadow-[8px_8px_0_black]">
                <h3 className="text-xl font-extrabold mb-4 tracking-wide">
                    QR PAYMENT INSTRUCTIONS
                </h3>
                <div className="space-y-3">
                    {[
                        "Enter the payment amount and optional description",
                        'Click "GENERATE QR CODE" to create the payment QR',
                        "Show the QR code to customer for scanning",
                        "Customer scans with their crypto wallet app",
                    ].map((text, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#ff005c] text-white flex items-center justify-center font-extrabold text-xs border-2 border-black">
                                {idx + 1}
                            </div>
                            <p className="text-sm text-gray-800">{text}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
