"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface QRStatusUpdate {
    requestId: string;
    status: "created" | "scanned" | "processing" | "completed" | "failed";
    timestamp: string;
    transactionId?: string;
    txHash?: string;
    amount?: number;
    gasFee?: number;
    totalAmount?: number;
    merchantId?: string;
    explorerUrl?: string;
    completedAt?: string;
    scannedAt?: string;
    userInfo?: {
        cardLast4: string;
    };
    error?: string;
}

interface UseSocketOptions {
    enableQRUpdates?: boolean;
    qrRequestId?: string;
}

export const useSocket = (options: UseSocketOptions = {}) => {
    const { enableQRUpdates = false, qrRequestId } = options;
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [qrStatus, setQrStatus] = useState<QRStatusUpdate | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            `http://${
                typeof window !== "undefined"
                    ? window.location.hostname
                    : "localhost"
            }:8080`;

        console.log("🔌 Connecting to socket server:", backendUrl);

        // Create socket connection
        socketRef.current = io(backendUrl, {
            transports: ["websocket", "polling"],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        const socket = socketRef.current;

        // Connection events
        socket.on("connect", () => {
            console.log("✅ Socket connected:", socket.id);
            setIsConnected(true);
            setConnectionError(null);

            // Join QR request room if specified
            if (enableQRUpdates && qrRequestId) {
                console.log("📱 Joining QR request room:", qrRequestId);
                socket.emit("join-qr-room", qrRequestId);
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("❌ Socket disconnected:", reason);
            setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("🔌 Socket connection error:", error);
            setConnectionError(error.message);
            setIsConnected(false);
        });

        // QR status update events
        if (enableQRUpdates) {
            socket.on("qr:status-update", (data: QRStatusUpdate) => {
                console.log("📱 QR Status Update received:", data);
                setQrStatus(data);

                // Show user notification based on status
                if (data.status === "scanned") {
                    console.log("🎯 QR Code was scanned by user!");
                } else if (data.status === "completed") {
                    console.log("✅ Payment completed successfully!");
                } else if (data.status === "failed") {
                    console.log("❌ Payment failed:", data.error);
                }
            });
        }

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                console.log("🔌 Disconnecting socket...");

                // Leave QR room before disconnect
                if (enableQRUpdates && qrRequestId) {
                    socketRef.current.emit("leave-qr-room", qrRequestId);
                }

                socketRef.current.disconnect();
            }
        };
    }, [enableQRUpdates, qrRequestId]);

    // Join/leave QR request room dynamically
    const joinQRRoom = (requestId: string) => {
        if (socketRef.current && isConnected) {
            console.log("📱 Joining QR request room:", requestId);
            socketRef.current.emit("join-qr-room", requestId);
        }
    };

    const leaveQRRoom = (requestId: string) => {
        if (socketRef.current && isConnected) {
            console.log("📱 Leaving QR request room:", requestId);
            socketRef.current.emit("leave-qr-room", requestId);
        }
    };

    // Send custom events
    const emit = (event: string, data?: any) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit(event, data);
        }
    };

    // Listen for custom events
    const on = (event: string, handler: (data: any) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, handler);
        }
    };

    const off = (event: string, handler?: (data: any) => void) => {
        if (socketRef.current) {
            if (handler) {
                socketRef.current.off(event, handler);
            } else {
                socketRef.current.off(event);
            }
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        qrStatus,
        joinQRRoom,
        leaveQRRoom,
        emit,
        on,
        off,
        // Helper methods
        resetQRStatus: () => setQrStatus(null),
    };
};
