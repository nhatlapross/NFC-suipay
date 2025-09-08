"use client";
import { useState } from "react";
import {
    Lock,
    Unlock,
    RotateCcw,
    CreditCard,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

const WalletManagement: React.FC = () => {
    const [cards, setCards] = useState([
        {
            id: "CARD001",
            holder: "JOHN SMITH",
            balance: "$2,450.00",
            status: "ACTIVE",
            lastUsed: "2 MIN AGO",
        },
        {
            id: "CARD002",
            holder: "SARAH JONES",
            balance: "$890.50",
            status: "LOCKED",
            lastUsed: "1 HR AGO",
        },
        {
            id: "CARD003",
            holder: "MIKE WILSON",
            balance: "$5,200.00",
            status: "ACTIVE",
            lastUsed: "15 MIN AGO",
        },
        {
            id: "CARD004",
            holder: "EMMA DAVIS",
            balance: "$1,100.75",
            status: "SUSPENDED",
            lastUsed: "3 HRS AGO",
        },
        {
            id: "CARD005",
            holder: "ALEX BROWN",
            balance: "$750.00",
            status: "ACTIVE",
            lastUsed: "5 MIN AGO",
        },
        {
            id: "CARD006",
            holder: "LISA GARCIA",
            balance: "$3,300.25",
            status: "LOCKED",
            lastUsed: "30 MIN AGO",
        },
    ]);

    const toggleCardStatus = (cardId: string) => {
        setCards(
            cards.map((card) => {
                if (card.id === cardId) {
                    return {
                        ...card,
                        status: card.status === "ACTIVE" ? "LOCKED" : "ACTIVE",
                    };
                }
                return card;
            })
        );
    };

    const resetKey = (cardId: string) => {
        // Mock key reset functionality
        alert(`Key reset initiated for ${cardId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-[#00F0FF] text-black";
            case "LOCKED":
                return "bg-[#FF005C] text-white";
            case "SUSPENDED":
                return "bg-black text-white";
            default:
                return "bg-gray-400 text-black";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <CheckCircle className="w-4 h-4" />;
            case "LOCKED":
                return <Lock className="w-4 h-4" />;
            case "SUSPENDED":
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="border-4 border-black bg-[#FF005C] p-6 shadow-[8px_8px_0_black]">
                <h1 className="text-3xl font-bold text-white mb-2">
                    WALLET MANAGEMENT
                </h1>
                <p className="text-white font-medium">
                    CARD CONTROL & MONITORING
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-right">
                <div className="bg-[#00F0FF] p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-black">4</div>
                    <div className="font-bold text-sm text-black">
                        ACTIVE CARDS
                    </div>
                </div>
                <div className="bg-[#FF005C] p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="font-semibold text-sm text-white">
                        LOCKED CARDS
                    </div>
                </div>
                <div className="bg-black p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-white">1</div>
                    <div className="font-semibold text-sm text-white">
                        SUSPENDED
                    </div>
                </div>
                <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0_black]">
                    <div className="text-2xl font-bold text-black">$13.7K</div>
                    <div className="font-semibold text-sm text-black">
                        TOTAL BALANCE
                    </div>
                </div>
            </div>

            {/* Cards List */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-semibold mb-6 text-black">
                    CARD MANAGEMENT
                </h2>
                <div className="space-y-4">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="flex items-center justify-between p-6 border-2 border-black bg-white"
                        >
                            <div className="flex items-center gap-6">
                                <CreditCard className="w-8 h-8 text-black" />
                                <div>
                                    <div className="font-bold text-black text-lg">
                                        {card.id}
                                    </div>
                                    <div className="text-sm text-gray-600 font-medium">
                                        {card.holder}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xl font-bold text-black">
                                {card.balance}
                            </div>

                            <div
                                className={`px-3 py-2 border-2 border-black font-bold text-sm flex items-center gap-2 ${getStatusColor(
                                    card.status
                                )}`}
                            >
                                {getStatusIcon(card.status)}
                                {card.status}
                            </div>

                            <div className="text-sm font-bold text-gray-600">
                                {card.lastUsed}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleCardStatus(card.id)}
                                    className={`p-3 border-2 border-black font-bold hover:shadow-[4px_4px_0_black] transition-all ${
                                        card.status === "ACTIVE"
                                            ? "bg-[#FF005C] text-white hover:bg-red-600"
                                            : "bg-[#00F0FF] text-black hover:bg-cyan-400"
                                    }`}
                                >
                                    {card.status === "ACTIVE" ? (
                                        <Lock className="w-4 h-4" />
                                    ) : (
                                        <Unlock className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => resetKey(card.id)}
                                    className="p-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 hover:shadow-[4px_4px_0_black] transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="p-6 bg-[#00F0FF] border-4 border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all">
                    <div className="text-xl font-bold text-black">
                        BULK LOCK
                    </div>
                    <div className="text-sm text-black font-medium">
                        LOCK ALL CARDS
                    </div>
                </button>

                <button className="p-6 bg-[#FF005C] border-4 border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all">
                    <div className="text-xl font-bold text-white">
                        EMERGENCY STOP
                    </div>
                    <div className="text-sm text-white font-medium">
                        SUSPEND ALL
                    </div>
                </button>

                <button className="p-6 bg-black border-4 border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all">
                    <div className="text-xl font-bold text-white">
                        RESET ALL KEYS
                    </div>
                    <div className="text-sm text-white font-medium">
                        BULK KEY RESET
                    </div>
                </button>
            </div>
        </div>
    );
};

export default WalletManagement;
