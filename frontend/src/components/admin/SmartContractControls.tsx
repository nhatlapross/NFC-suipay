"use client";
import { useState } from "react";
import {
    Settings,
    DollarSign,
    Users,
    Pause,
    Play,
    AlertTriangle,
    Shield,
} from "lucide-react";

const SmartContractControls: React.FC = () => {
    const [dailyLimit, setDailyLimit] = useState("5000");
    const [multiSigEnabled, setMultiSigEnabled] = useState(true);
    const [contractPaused, setContractPaused] = useState(false);
    const [requiredSignatures, setRequiredSignatures] = useState("3");

    const handleLimitUpdate = () => {
        alert(`Daily spending limit updated to $${dailyLimit}`);
    };

    const toggleMultiSig = () => {
        setMultiSigEnabled(!multiSigEnabled);
    };

    const toggleContractPause = () => {
        setContractPaused(!contractPaused);
    };

    const contractStats = [
        { label: "CONTRACT VERSION", value: "v2.1.4", icon: Settings },
        { label: "DAILY LIMIT", value: `$${dailyLimit}`, icon: DollarSign },
        { label: "SIGNERS", value: "5/8", icon: Users },
        {
            label: "STATUS",
            value: contractPaused ? "PAUSED" : "ACTIVE",
            icon: contractPaused ? Pause : Play,
        },
    ];

    return (
        <div className="space-y-8 w-full">
            <div className="border-4 border-black bg-black p-4 lg:p-6 shadow-[8px_8px_0_black]">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    SMART CONTRACT CONTROLS
                </h1>
                <p className="text-[#00F0FF] font-medium">
                    BLOCKCHAIN CONFIGURATION PANEL
                </p>
            </div>

            {/* Contract Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {contractStats.map((stat, index) => {
                    const Icon = stat.icon;
                    const isStatus = stat.label === "STATUS";
                    const bgColor = isStatus
                        ? contractPaused
                            ? "bg-[#FF005C]"
                            : "bg-[#00F0FF]"
                        : index % 2 === 0
                        ? "bg-[#00F0FF]"
                        : "bg-white";
                    const textColor = isStatus
                        ? contractPaused
                            ? "text-white"
                            : "text-black"
                        : index % 2 === 0
                        ? "text-black"
                        : "text-black";

                    return (
                        <div
                            key={index}
                            className={`${bgColor} p-6 border-4 border-black shadow-[6px_6px_0_black]`}
                        >
                            <div className="flex items-center justify-between">
                                <Icon className="w-8 h-8" />
                                <div className={`${textColor} text-right`}>
                                    <div className="text-2xl font-bold">
                                        {stat.value}
                                    </div>
                                    <div
                                        className={`font-semibold text-sm ${textColor}`}
                                    >
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Controls */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Daily Spending Limit */}
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                    <h2 className="text-xl font-bold mb-6 text-black flex items-center gap-3">
                        <DollarSign className="w-6 h-6" />
                        DAILY SPENDING LIMIT
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-black mb-2">
                                CURRENT LIMIT ($)
                            </label>
                            <input
                                type="number"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(e.target.value)}
                                className="w-full p-4 border-4 border-black font-bold text-xl bg-white focus:bg-[#00F0FF] focus:outline-none"
                            />
                        </div>

                        <button
                            onClick={handleLimitUpdate}
                            className="w-full p-4 bg-[#FF005C] text-white border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all"
                        >
                            UPDATE LIMIT
                        </button>

                        <div className="p-4 bg-yellow-200 border-2 border-black">
                            <div className="flex items-center gap-2 text-black">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-bold text-sm">
                                    CHANGES REQUIRE 24H DELAY
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multi-Signature Settings */}
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                    <h2 className="text-xl font-bold mb-6 text-black flex items-center gap-3">
                        <Shield className="w-6 h-6" />
                        MULTI-SIGNATURE
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border-2 border-black">
                            <span className="font-bold text-black">
                                MULTI-SIG STATUS
                            </span>
                            <button
                                onClick={toggleMultiSig}
                                className={`px-6 py-2 border-2 border-black font-bold ${
                                    multiSigEnabled
                                        ? "bg-[#00F0FF] text-black"
                                        : "bg-[#FF005C] text-white"
                                }`}
                            >
                                {multiSigEnabled ? "ENABLED" : "DISABLED"}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-2">
                                REQUIRED SIGNATURES
                            </label>
                            <select
                                value={requiredSignatures}
                                onChange={(e) =>
                                    setRequiredSignatures(e.target.value)
                                }
                                className="w-full p-4 border-4 border-black font-bold bg-white focus:bg-[#00F0FF] focus:outline-none"
                            >
                                <option value="2">2 OF 8</option>
                                <option value="3">3 OF 8</option>
                                <option value="4">4 OF 8</option>
                                <option value="5">5 OF 8</option>
                            </select>
                        </div>

                        <div className="p-4 bg-[#00F0FF] border-2 border-black">
                            <div className="text-black font-bold text-sm">
                                CURRENT SIGNERS: 8
                            </div>
                            <div className="text-black text-xs">
                                ACTIVE WALLETS: 5
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Emergency Controls */}
            <div className="bg-[#FF005C] border-4 border-black p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    EMERGENCY CONTROLS
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        onClick={toggleContractPause}
                        className={`p-6 border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all ${
                            contractPaused
                                ? "bg-[#00F0FF] text-black"
                                : "bg-black text-white"
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {contractPaused ? (
                                <Play className="w-6 h-6" />
                            ) : (
                                <Pause className="w-6 h-6" />
                            )}
                        </div>
                        <div className="text-lg">
                            {contractPaused ? "RESUME" : "PAUSE"}
                        </div>
                        <div className="text-sm">CONTRACT</div>
                    </button>

                    <button className="p-6 bg-white text-black border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div className="text-lg">UPGRADE</div>
                        <div className="text-sm">CONTRACT</div>
                    </button>

                    <button className="p-6 bg-black text-white border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="text-lg">EMERGENCY</div>
                        <div className="text-sm">SHUTDOWN</div>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-black border-2 border-black text-white">
                    <div className="font-bold text-sm">
                        ⚠️ WARNING: EMERGENCY ACTIONS ARE IRREVERSIBLE
                    </div>
                    <div className="text-xs mt-1">
                        ALL EMERGENCY ACTIONS REQUIRE MULTI-SIG APPROVAL
                    </div>
                </div>
            </div>

            {/* Recent Contract Events */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-bold mb-6 text-black">
                    RECENT CONTRACT EVENTS
                </h2>
                <div className="space-y-3">
                    {[
                        {
                            event: "LIMIT_UPDATED",
                            details: "Daily limit changed to $5,000",
                            time: "2 MIN AGO",
                            type: "INFO",
                        },
                        {
                            event: "MULTISIG_ENABLED",
                            details: "Multi-signature requirement activated",
                            time: "1 HR AGO",
                            type: "SUCCESS",
                        },
                        {
                            event: "SIGNER_ADDED",
                            details: "New signer wallet added: 0x742d...",
                            time: "3 HRS AGO",
                            type: "INFO",
                        },
                        {
                            event: "CONTRACT_PAUSED",
                            details: "Emergency pause activated",
                            time: "1 DAY AGO",
                            type: "WARNING",
                        },
                    ].map((event, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 border-2 border-black"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                                        event.type === "SUCCESS"
                                            ? "bg-[#00F0FF] text-black"
                                            : event.type === "WARNING"
                                            ? "bg-[#FF005C] text-white"
                                            : "bg-black text-white"
                                    }`}
                                >
                                    {event.event}
                                </div>
                                <div className="font-medium text-black">
                                    {event.details}
                                </div>
                            </div>
                            <div className="text-sm font-bold text-gray-600">
                                {event.time}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SmartContractControls;
