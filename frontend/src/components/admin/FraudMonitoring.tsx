"use client";
import { useState } from "react";
import {
    AlertTriangle,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    ShieldAlert,
    ShieldX,
    ShieldCheck,
    DollarSign,
    Trash2,
    Check,
    CircleX,
} from "lucide-react";

const FraudMonitoring: React.FC = () => {
    const [alerts, setAlerts] = useState([
        {
            id: "ALERT001",
            type: "SUSPICIOUS_AMOUNT",
            severity: "HIGH",
            description: "Transaction amount 500% above user average",
            user: "JOHN SMITH",
            amount: "$12,500.00",
            time: "2 MIN AGO",
            status: "PENDING",
        },
        {
            id: "ALERT002",
            type: "LOCATION_ANOMALY",
            severity: "MEDIUM",
            description: "Transaction from unusual geographic location",
            user: "SARAH JONES",
            amount: "$890.50",
            time: "15 MIN AGO",
            status: "INVESTIGATING",
        },
        {
            id: "ALERT003",
            type: "VELOCITY_CHECK",
            severity: "HIGH",
            description: "Multiple rapid transactions detected",
            user: "MIKE WILSON",
            amount: "$3,200.00",
            time: "1 HR AGO",
            status: "BLOCKED",
        },
        {
            id: "ALERT004",
            type: "PATTERN_MATCH",
            severity: "LOW",
            description: "Transaction pattern matches known fraud signature",
            user: "EMMA DAVIS",
            amount: "$450.75",
            time: "2 HRS AGO",
            status: "RESOLVED",
        },
    ]);

    const handleAlertAction = (alertId: string, action: string) => {
        setAlerts(
            alerts.map((alert) => {
                if (alert.id === alertId) {
                    return { ...alert, status: action };
                }
                return alert;
            })
        );
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "HIGH":
                return "bg-[#FF005C] text-white";
            case "MEDIUM":
                return "bg-yellow-400 text-black";
            case "LOW":
                return "bg-[#00F0FF] text-black";
            default:
                return "bg-gray-400 text-black";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-400 text-black";
            case "INVESTIGATING":
                return "bg-[#00F0FF] text-black";
            case "BLOCKED":
                return "bg-[#FF005C] text-white";
            case "RESOLVED":
                return "bg-black text-white";
            default:
                return "bg-gray-400 text-black";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Clock className="w-4 h-4" />;
            case "INVESTIGATING":
                return <Eye className="w-4 h-4" />;
            case "BLOCKED":
                return <XCircle className="w-4 h-4" />;
            case "RESOLVED":
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const fraudStats = [
        {
            label: "ACTIVE ALERTS",
            value: "12",
            icon: ShieldAlert,
            color: "bg-[#FF005C] text-white",
        },
        {
            label: "BLOCKED TODAY",
            value: "8",
            icon: ShieldX,
            color: "bg-black text-white",
        },
        {
            label: "FALSE POSITIVES",
            value: "3",
            icon: ShieldCheck,
            color: "bg-[#00F0FF] text-black",
        },
        {
            label: "TOTAL SAVED",
            value: "$45.2K",
            icon: DollarSign,
            color: "bg-white text-black border-2 border-black",
        },
    ];

    return (
        <div className="space-y-8 w-full">
            <div className="border-4 border-black bg-[#FF005C] p-4 lg:p-6 shadow-[8px_8px_0_black]">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    FRAUD MONITORING
                </h1>
                <p className="text-white font-medium">
                    REAL-TIME THREAT DETECTION
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {fraudStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`${stat.color} p-6 border-4 border-black shadow-[6px_6px_0_black]`}
                        >
                            <div className="flex items-center justify-between">
                                <Icon className="w-8 h-8" />
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {stat.value}
                                    </div>
                                    <div className="font-semibold text-sm">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alert Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="p-4 bg-[#FF005C] text-white border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                    <div>BLOCK ALL</div>
                </button>

                <button className="p-4 bg-[#00F0FF] text-black border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all">
                    <Eye className="w-6 h-6 mx-auto mb-2" />
                    <div>INVESTIGATE</div>
                </button>

                <button className="p-4 bg-black text-white border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all">
                    <Check className="w-6 h-6 mx-auto mb-2" />
                    <div>APPROVE ALL</div>
                </button>

                <button className="p-4 bg-white text-black border-4 border-black font-bold hover:shadow-[6px_6px_0_black] transition-all">
                    <Trash2 className="w-6 h-6 mx-auto mb-2" />
                    <div>CLEAR ALERTS</div>
                </button>
            </div>

            {/* Suspicious Activities */}
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                <h2 className="text-xl font-bold mb-6 text-black">
                    SUSPICIOUS ACTIVITIES
                </h2>
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="border-2 border-black p-6 bg-white"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="w-6 h-6 text-[#FF005C] mt-1" />
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-black text-lg">
                                                {alert.id}
                                            </span>
                                            <div
                                                className={`px-3 py-1 border-2 border-black font-bold text-xs ${getSeverityColor(
                                                    alert.severity
                                                )}`}
                                            >
                                                {alert.severity}
                                            </div>
                                            <div
                                                className={`px-3 py-1 border-2 border-black font-bold text-xs flex items-center gap-1 ${getStatusColor(
                                                    alert.status
                                                )}`}
                                            >
                                                {getStatusIcon(alert.status)}
                                                {alert.status}
                                            </div>
                                        </div>
                                        <div className="text-black font-medium mb-2">
                                            {alert.description}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="font-bold text-black">
                                                USER: {alert.user}
                                            </span>
                                            <span className="font-bold text-black">
                                                AMOUNT: {alert.amount}
                                            </span>
                                            <span className="text-gray-600 font-bold">
                                                {alert.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleAlertAction(
                                                alert.id,
                                                "INVESTIGATING"
                                            )
                                        }
                                        className="px-4 py-2 bg-[#00F0FF] text-black border-2 border-black font-bold hover:shadow-[4px_4px_0_black] transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleAlertAction(
                                                alert.id,
                                                "BLOCKED"
                                            )
                                        }
                                        className="px-4 py-2 bg-[#FF005C] text-white border-2 border-black font-bold hover:shadow-[4px_4px_0_black] transition-all"
                                    >
                                        <CircleX className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleAlertAction(
                                                alert.id,
                                                "RESOLVED"
                                            )
                                        }
                                        className="px-4 py-2 bg-black text-white border-2 border-black font-bold hover:shadow-[4px_4px_0_black] transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fraud Detection Settings */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                    <h2 className="text-xl font-bold mb-6 text-black">
                        DETECTION RULES
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                rule: "AMOUNT_THRESHOLD",
                                status: "ENABLED",
                                threshold: "$10,000",
                            },
                            {
                                rule: "VELOCITY_CHECK",
                                status: "ENABLED",
                                threshold: "5 TXN/MIN",
                            },
                            {
                                rule: "LOCATION_ANOMALY",
                                status: "ENABLED",
                                threshold: "500 MILES",
                            },
                            {
                                rule: "PATTERN_MATCHING",
                                status: "DISABLED",
                                threshold: "ML MODEL",
                            },
                        ].map((rule, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 border-2 border-black"
                            >
                                <div>
                                    <div className="font-bold text-black">
                                        {rule.rule}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {rule.threshold}
                                    </div>
                                </div>
                                <div
                                    className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                                        rule.status === "ENABLED"
                                            ? "bg-[#00F0FF] text-black"
                                            : "bg-gray-400 text-black"
                                    }`}
                                >
                                    {rule.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black]">
                    <h2 className="text-xl font-bold mb-6 text-black">
                        SYSTEM HEALTH
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-[#00F0FF] border-2 border-black">
                            <div className="font-bold text-black">
                                ML MODEL STATUS
                            </div>
                            <div className="text-sm text-black">
                                ONLINE - ACCURACY: 94.2%
                            </div>
                        </div>

                        <div className="p-4 bg-[#00F0FF] border-2 border-black">
                            <div className="font-bold text-black">
                                RULE ENGINE
                            </div>
                            <div className="text-sm text-black">
                                OPERATIONAL - 12 RULES ACTIVE
                            </div>
                        </div>

                        <div className="p-4 bg-[#00F0FF] border-2 border-black">
                            <div className="font-bold text-black">
                                ALERT QUEUE
                            </div>
                            <div className="text-sm text-black">
                                12 PENDING - AVG RESPONSE: 3.2 MIN
                            </div>
                        </div>

                        <div className="p-4 bg-black border-2 border-black">
                            <div className="font-bold text-white">
                                LAST UPDATE
                            </div>
                            <div className="text-sm text-white">
                                2 MINUTES AGO
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FraudMonitoring;
