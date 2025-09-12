import React, { useEffect, useState } from "react";
import { Lock, Unlock, DollarSign, Shield, Smartphone } from "lucide-react";
import { getUserSettingsAPI, updateUserSettingsAPI, getUserLimitsAPI, updateUserLimitsAPI } from "@/lib/api-client";

const SettingsScreen: React.FC = () => {
    const [cardLocked, setCardLocked] = useState(false);
    const [dailyLimit, setDailyLimit] = useState(0);
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [monthlyLimit, setMonthlyLimit] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            setError("");
            try {
                const resp: any = await getUserSettingsAPI();
                if (resp?.success && resp?.settings) {
                    setTwoFactorEnabled(!!resp.settings.twoFactorAuth);
                    setDailyLimit(resp.settings.dailyLimit ?? 0);
                    setMonthlyLimit(resp.settings.monthlyLimit ?? 0);
                } else {
                    setError("Failed to load settings");
                }
                // Also load limits explicitly to be safe
                try {
                    const limits: any = await getUserLimitsAPI();
                    if (limits?.success && limits?.limits) {
                        setDailyLimit(limits.limits.dailyLimit ?? 0);
                        setMonthlyLimit(limits.limits.monthlyLimit ?? 0);
                    }
                } catch {}
            } catch (err: any) {
                setError(err?.response?.data?.error || "Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleDailyLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setDailyLimit(value);
    };

    const handleMonthlyLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setMonthlyLimit(value);
    };

    const saveLimits = async () => {
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const resp: any = await updateUserLimitsAPI({ dailyLimit, monthlyLimit });
            if (resp?.success && resp?.limits) {
                setDailyLimit(resp.limits.dailyLimit ?? dailyLimit);
                setMonthlyLimit(resp.limits.monthlyLimit ?? monthlyLimit);
                setMessage("Spending limits updated");
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to update limits");
        } finally {
            setSaving(false);
        }
    };

    const toggleTwoFactor = async () => {
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const resp: any = await updateUserSettingsAPI({ twoFactorAuth: !twoFactorEnabled });
            if (resp?.success && resp?.settings) {
                setTwoFactorEnabled(!!resp.settings.twoFactorAuth);
                setMessage("Security settings updated");
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    SETTINGS
                </h1>
                <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {loading && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono">Đang tải cài đặt...</p>
                </div>
            )}
            {error && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono text-red-600">{error}</p>
                </div>
            )}
            {message && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono text-green-700">{message}</p>
                </div>
            )}

            {/* Card Control (local only demo) */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-neo-pink p-3 border-2 border-neo-black">
                        {cardLocked ? (
                            <Lock size={24} className="text-neo-white" />
                        ) : (
                            <Unlock size={24} className="text-neo-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            CARD CONTROL
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Lock or unlock your card instantly
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setCardLocked(!cardLocked)}
                    className={`w-full py-4 font-mono font-bold text-lg border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow ${
                        cardLocked
                            ? "bg-neo-cyan text-neo-black"
                            : "bg-neo-pink text-neo-white"
                    }`}
                >
                    {cardLocked ? "UNLOCK CARD" : "LOCK CARD"}
                </button>
            </div>

            {/* Daily Spending Limit (read-only from settings for now) */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-neo-cyan p-3 border-2 border-neo-black">
                        <DollarSign size={24} className="text-neo-black" />
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            DAILY LIMIT
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Set your daily spending limit
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative flex items-center gap-4">
                        <span className="absolute left-2.5 font-mono text-lg font-bold text-neo-black">
                            $
                        </span>
                        <input
                            type="number"
                            value={dailyLimit}
                            onChange={handleDailyLimitChange}
                            className="flex-1 p-3 pl-5 border-4 border-neo-black font-mono font-bold text-lg bg-neo-white focus:outline-none focus:shadow-brutal"
                            min="0"
                            max="10000"
                            step="50"
                            disabled={saving}
                        />
                    </div>

                    <div className="flex gap-2">
                        {[500, 1000, 2000, 5000].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setDailyLimit(amount)}
                                className={`flex-1 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                    dailyLimit === amount
                                        ? "bg-neo-black text-neo-white"
                                        : "bg-neo-white text-neo-black hover:bg-neo-cyan"
                                }`}
                                disabled={saving}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Limit */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-neo-cyan p-3 border-2 border-neo-black">
                        <DollarSign size={24} className="text-neo-black" />
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            MONTHLY LIMIT
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Set your monthly spending limit
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative flex items-center gap-4">
                        <span className="absolute left-2.5 font-mono text-lg font-bold text-neo-black">
                            $
                        </span>
                        <input
                            type="number"
                            value={monthlyLimit}
                            onChange={handleMonthlyLimitChange}
                            className="flex-1 p-3 pl-5 border-4 border-neo-black font-mono font-bold text-lg bg-neo-white focus:outline-none focus:shadow-brutal"
                            min="0"
                            max="10000"
                            step="50"
                            disabled={saving}
                        />
                    </div>

                    <div className="flex gap-2">
                        {[500, 1000, 2000, 5000].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setMonthlyLimit(amount)}
                                className={`flex-1 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                    monthlyLimit === amount
                                        ? "bg-neo-black text-neo-white"
                                        : "bg-neo-white text-neo-black hover:bg-neo-cyan"
                                }`}
                                disabled={saving}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save Limits Action */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <button
                    onClick={saveLimits}
                    disabled={saving}
                    className={`w-full py-4 font-mono font-bold text-lg border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow ${
                        saving ? 'bg-gray-300 text-gray-600' : 'bg-neo-black text-neo-white'
                    }`}
                >
                    {saving ? 'SAVING...' : 'SAVE LIMITS'}
                </button>
            </div>

            {/* Security Settings */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neo-black p-3 border-2 border-neo-black">
                        <Shield size={24} className="text-neo-white" />
                    </div>
                    <div>
                        <h3 className="font-mono font-bold text-lg text-neo-black">
                            SECURITY
                        </h3>
                        <p className="font-mono text-xs text-neo-black opacity-70">
                            Manage your security preferences
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* OTP Toggle (local-only) */}
                    <div className="flex items-center justify-between p-4 border-2 border-neo-black">
                        <div className="flex items-center gap-3">
                            <Smartphone size={20} className="text-neo-black" />
                            <div>
                                <p className="font-mono font-bold text-sm text-neo-black">
                                    OTP VERIFICATION
                                </p>
                                <p className="font-mono text-xs text-neo-black opacity-70">
                                    SMS one-time passwords
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOtpEnabled(!otpEnabled)}
                            className={`px-4 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                otpEnabled
                                    ? "bg-neo-cyan text-neo-black"
                                    : "bg-neo-white text-neo-black hover:bg-neo-pink hover:text-neo-white"
                            }`}
                        >
                            {otpEnabled ? "ON" : "OFF"}
                        </button>
                    </div>

                    {/* 2FA Toggle (persisted) */}
                    <div className="flex items-center justify-between p-4 border-2 border-neo-black">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-neo-black" />
                            <div>
                                <p className="font-mono font-bold text-sm text-neo-black">
                                    TWO-FACTOR AUTH
                                </p>
                                <p className="font-mono text-xs text-neo-black opacity-70">
                                    App-based authentication
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTwoFactor}
                            disabled={saving}
                            className={`px-4 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                twoFactorEnabled
                                    ? "bg-neo-cyan text-neo-black"
                                    : "bg-neo-white text-neo-black hover:bg-neo-pink hover:text-neo-white"
                            }`}
                        >
                            {twoFactorEnabled ? (saving ? "SAVING..." : "ON") : (saving ? "SAVING..." : "OFF")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Emergency Actions */}
            <div className="bg-neo-pink border-4 border-neo-black shadow-brutal p-6">
                <h3 className="font-mono font-bold text-lg text-neo-white mb-4">
                    EMERGENCY ACTIONS
                </h3>
                <div className="space-y-3">
                    <button className="w-full py-3 bg-neo-white text-neo-black border-2 border-neo-black font-mono font-bold hover:bg-neo-black hover:text-neo-white transition-colors">
                        FREEZE ALL TRANSACTIONS
                    </button>
                    <button className="w-full py-3 bg-neo-white text-neo-black border-2 border-neo-black font-mono font-bold hover:bg-neo-black hover:text-neo-white transition-colors">
                        REPORT CARD STOLEN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
