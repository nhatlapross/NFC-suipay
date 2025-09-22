"use client";

import React from "react";
import Link from "next/link";
import { Radio, QrCode, List, User } from "lucide-react";

function ActionCard({
    href,
    title,
    subtitle,
    color,
    icon: Icon,
}: {
    href: string;
    title: string;
    subtitle: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Link
            href={href}
            className={`block rounded-md border border-black shadow-md overflow-hidden`}
        >
            <div
                className={`${color} text-white px-4 py-6 flex items-center justify-between`}
            >
                <div>
                    <div className="text-sm font-bold tracking-widest">
                        {title}
                    </div>
                    <div className="text-[10px] opacity-90 mt-1">
                        {subtitle}
                    </div>
                </div>
                <Icon className="w-6 h-6 opacity-90" />
            </div>
        </Link>
    );
}

export default function MerchantQuickActions() {
    return (
        <div>
            <div className="text-xs font-bold text-gray-700 mb-2">
                QUICK ACTIONS
            </div>
            <div className="space-y-3">
                <ActionCard
                    href="/payment"
                    title="NFC PAYMENT"
                    subtitle="TAP CARD TO PAY"
                    color="bg-[#ff007f]"
                    icon={Radio}
                />
                <ActionCard
                    href="/payment"
                    title="QR PAYMENT"
                    subtitle="GENERATE QR CODE"
                    color="bg-[#00e5ff]"
                    icon={QrCode}
                />
                <ActionCard
                    href="/history"
                    title="TRANSACTIONS"
                    subtitle="VIEW HISTORY"
                    color="bg-[#b180ff]"
                    icon={List}
                />
                <ActionCard
                    href="/settings"
                    title="PROFILE"
                    subtitle="SETTINGS"
                    color="bg-[#ffa24a]"
                    icon={User}
                />
            </div>
        </div>
    );
}
