"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";

interface MerchantHeaderProps {
    containerClassName?: string;
    view: "dashboard" | "nfc" | "qr" | "tx" | "settings" | "api-test";
    onViewChange: Dispatch<
        SetStateAction<
            "dashboard" | "nfc" | "qr" | "tx" | "settings" | "api-test"
        >
    >;
}

export default function MerchantHeader({
    containerClassName = "max-w-7xl",
    view,
    onViewChange,
}: MerchantHeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="bg-[#ff005c]">
            <div
                className={`relative ${containerClassName} mx-auto px-8 py-5 flex items-center justify-between`}
            >
                <div className="flex items-center gap-3">
                    <Link href="/" className="bg-black p-2 rounded block">
                        <img
                            src="/panda.png"
                            alt="Merchant Logo"
                            className="h-12 w-12 object-cover rounded"
                        />
                    </Link>
                    <div>
                        <div className="text-white font-bold text-3xl">
                            MERCHANT
                        </div>
                        <div className="text-white text-xl">TERMINAL</div>
                    </div>
                </div>
                <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="bg-black p-2 rounded block"
                >
                    <Menu className="h-6 w-6 text-white" />
                </button>

                {menuOpen && (
                    <div className="absolute top-full right-8 mt-3 w-64 bg-white border-2 border-black shadow-xl z-50">
                        <div className="p-2 border-b-2 border-black text-sm font-bold text-gray-700 uppercase">
                            Quick Navigate
                        </div>
                        <nav className="p-2 space-y-2">
                            <div
                                onClick={() => {
                                    setMenuOpen(false);
                                    onViewChange("nfc");
                                }}
                                className="block px-3 py-2 border border-black hover:bg-gray-50 cursor-pointer"
                            >
                                NFC Payment
                            </div>
                            <div
                                onClick={() => {
                                    setMenuOpen(false);
                                    onViewChange("qr");
                                }}
                                className="block px-3 py-2 border border-black hover:bg-gray-50 cursor-pointer"
                            >
                                QR Payment
                            </div>
                            <div
                                onClick={() => {
                                    setMenuOpen(false);
                                    onViewChange("tx");
                                }}
                                className="block px-3 py-2 border border-black hover:bg-gray-50 cursor-pointer"
                            >
                                Transactions
                            </div>
                            <div
                                onClick={() => {
                                    setMenuOpen(false);
                                    onViewChange("settings");
                                }}
                                className="block px-3 py-2 border border-black hover:bg-gray-50 cursor-pointer"
                            >
                                Profile / Settings
                            </div>
                            <div
                                onClick={() => {
                                    setMenuOpen(false);
                                    onViewChange("dashboard");
                                }}
                                className="block px-3 py-2 border border-black hover:bg-gray-50 cursor-pointer"
                            >
                                Back to Merchant
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}
