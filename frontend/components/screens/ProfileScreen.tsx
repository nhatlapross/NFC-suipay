"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, Shield, Key, Users } from "lucide-react";
import { getUserProfileAPI } from "@/lib/api-client";
import { formatAddress } from "@/lib/utils";

type ProfileView = {
    name: string;
    email: string;
    phone: string;
    recoveryEmail: string;
    multiSigEnabled: boolean;
    walletAddress?: string;
};

const ProfileScreen: React.FC = () => {
    const [profile, setProfile] = useState<ProfileView | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await getUserProfileAPI();
                if (response.success) {
                    const u = response.user;
                    setProfile({
                        name: u.fullName || "",
                        email: u.email || "",
                        phone: u.phoneNumber || "",
                        recoveryEmail: u.email || "",
                        multiSigEnabled: Boolean(u.multiSigEnabled),
                        walletAddress: u.walletAddress,
                    });
                } else {
                    setError("Không tải được thông tin hồ sơ");
                }
            } catch (err) {
                setError("Không tải được thông tin hồ sơ");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleInputChange = (
        field: keyof ProfileView,
        value: string | boolean
    ) => {
        setProfile((prev) =>
            prev
                ? {
                      ...prev,
                      [field]: value,
                  }
                : prev
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-mono font-bold text-neo-black mb-2">
                    PROFILE
                </h1>
                <div className="w-16 h-1 bg-neo-pink mx-auto"></div>
            </div>

            {/* Loading / Error */}
            {loading && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono">Đang tải hồ sơ...</p>
                </div>
            )}
            {error && (
                <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                    <p className="font-mono text-red-600">{error}</p>
                </div>
            )}

            {/* Profile Picture & Basic Info */}
            <div className="bg-neo-cyan border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-neo-pink border-4 border-neo-black flex items-center justify-center">
                        <User size={40} className="text-neo-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-mono font-bold text-2xl text-neo-black mb-1">
                            {profile?.name || ""}
                        </h2>
                        <p className="font-mono text-sm text-neo-black opacity-70">
                            WALLET:{" "}
                            {formatAddress(profile?.walletAddress || "N/A")}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-neo-white text-neo-black border-2 border-neo-black shadow-brutal-sm hover:shadow-none transition-shadow px-4 py-2 font-mono text-xs font-bold"
                    >
                        {isEditing ? "SAVE" : "EDIT"}
                    </button>
                </div>
            </div>

            {/* Personal Information */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neo-black p-3 border-2 border-neo-black">
                        <User size={24} className="text-neo-white" />
                    </div>
                    <h3 className="font-mono font-bold text-lg text-neo-black">
                        PERSONAL INFO
                    </h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block font-mono text-xs font-bold text-neo-black mb-2">
                            FULL NAME
                        </label>
                        <input
                            type="text"
                            value={profile?.name || ""}
                            onChange={(e) =>
                                handleInputChange("name", e.target.value)
                            }
                            disabled={!isEditing || loading}
                            className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white disabled:opacity-50 focus:outline-none focus:shadow-brutal"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold text-neo-black mb-2">
                            EMAIL ADDRESS
                        </label>
                        <div className="flex items-center gap-3">
                            <Mail size={20} className="text-neo-black" />
                            <input
                                type="email"
                                value={profile?.email || ""}
                                onChange={(e) =>
                                    handleInputChange("email", e.target.value)
                                }
                                disabled={!isEditing || loading}
                                className="flex-1 p-3 border-4 border-neo-black font-mono bg-neo-white disabled:opacity-50 focus:outline-none focus:shadow-brutal"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold text-neo-black mb-2">
                            PHONE NUMBER
                        </label>
                        <div className="flex items-center gap-3">
                            <Phone size={20} className="text-neo-black" />
                            <input
                                type="tel"
                                value={profile?.phone || ""}
                                onChange={(e) =>
                                    handleInputChange("phone", e.target.value)
                                }
                                disabled={!isEditing || loading}
                                className="flex-1 p-3 border-4 border-neo-black font-mono bg-neo-white disabled:opacity-50 focus:outline-none focus:shadow-brutal"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recovery Settings */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neo-pink p-3 border-2 border-neo-black">
                        <Shield size={24} className="text-neo-white" />
                    </div>
                    <h3 className="font-mono font-bold text-lg text-neo-black">
                        RECOVERY
                    </h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block font-mono text-xs font-bold text-neo-black mb-2">
                            RECOVERY EMAIL
                        </label>
                        <input
                            type="email"
                            value={profile?.recoveryEmail || ""}
                            onChange={(e) =>
                                handleInputChange(
                                    "recoveryEmail",
                                    e.target.value
                                )
                            }
                            disabled={!isEditing || loading}
                            className="w-full p-3 border-4 border-neo-black font-mono bg-neo-white disabled:opacity-50 focus:outline-none focus:shadow-brutal"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-neo-black">
                        <div className="flex items-center gap-3">
                            <Key size={20} className="text-neo-black" />
                            <div>
                                <p className="font-mono font-bold text-sm text-neo-black">
                                    BACKUP PHRASE
                                </p>
                                <p className="font-mono text-xs text-neo-black opacity-70">
                                    12-word recovery phrase
                                </p>
                            </div>
                        </div>
                        <button className="bg-neo-cyan text-neo-black border-2 border-neo-black px-4 py-2 font-mono text-xs font-bold hover:bg-neo-black hover:text-neo-white transition-colors">
                            VIEW
                        </button>
                    </div>
                </div>
            </div>

            {/* Multi-Signature Settings */}
            <div className="bg-neo-white border-4 border-neo-black shadow-brutal p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neo-cyan p-3 border-2 border-neo-black">
                        <Users size={24} className="text-neo-black" />
                    </div>
                    <h3 className="font-mono font-bold text-lg text-neo-black">
                        MULTI-SIGNATURE
                    </h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border-2 border-neo-black">
                        <div>
                            <p className="font-mono font-bold text-sm text-neo-black">
                                MULTI-SIG WALLET
                            </p>
                            <p className="font-mono text-xs text-neo-black opacity-70">
                                Require multiple signatures for transactions
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                handleInputChange(
                                    "multiSigEnabled",
                                    !Boolean(profile?.multiSigEnabled)
                                )
                            }
                            className={`px-4 py-2 font-mono text-xs font-bold border-2 border-neo-black transition-colors ${
                                profile?.multiSigEnabled
                                    ? "bg-neo-cyan text-neo-black"
                                    : "bg-neo-white text-neo-black hover:bg-neo-pink hover:text-neo-white"
                            }`}
                        >
                            {profile?.multiSigEnabled ? "ON" : "OFF"}
                        </button>
                    </div>

                    {profile?.multiSigEnabled && (
                        <div className="bg-neo-black text-neo-white p-4">
                            <p className="font-mono text-xs mb-2">
                                AUTHORIZED SIGNERS:
                            </p>
                            <div className="space-y-1">
                                <p className="font-mono text-xs">
                                    • {profile?.email} (YOU)
                                </p>
                                <p className="font-mono text-xs">
                                    • backup@example.com
                                </p>
                                <p className="font-mono text-xs">
                                    • guardian@example.com
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-3">
                <button className="w-full py-4 bg-neo-black text-neo-white border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow font-mono font-bold">
                    EXPORT ACCOUNT DATA
                </button>
                <button className="w-full py-4 bg-neo-pink text-neo-white border-4 border-neo-black shadow-brutal hover:shadow-brutal-lg transition-shadow font-mono font-bold">
                    DELETE ACCOUNT
                </button>
            </div>
        </div>
    );
};

export default ProfileScreen;
