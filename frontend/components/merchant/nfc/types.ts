import { ReactNode } from "react";

export type PaymentState =
    | "ready"
    | "tap"
    | "pin"
    | "processing"
    | "success"
    | "failed";

export interface StateData {
    amount: string;
    amountBg: string;
    icon: ReactNode;
    title: string;
    description?: string;
    showButton: boolean;
    buttonText?: string;
    buttonColor?: string;
    showCancel: boolean;
    showNewPayment: boolean;
    transactionId?: string;
    transactionAmount?: string;
}

// Minimal Web NFC type declarations
export interface NDEFMessage {
    records: NDEFRecord[];
}

export interface NDEFRecord {
    recordType: string;
    mediaType?: string;
    data: BufferSource;
}

export interface PaymentResult {
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

export interface PosSessionResult {
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
