"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import merchantAPI, {
    MerchantCredentials,
    MerchantProfile,
} from "@/lib/merchant-api";
import { AxiosError } from "axios";

type Period = "daily" | "weekly" | "monthly";

export default function MerchantSettings() {
    const [form, setForm] = useState({
        businessName: "",
        businessType: "",
        address: "",
        taxId: "",
        email: "",
        phone: "",
        description: "",
        walletAddress: "",
        settlementPeriod: "daily" as Period,
        webhookUrl: "",
        logoFile: null as File | null,
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const onChange =
        (key: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm({ ...form, [key]: e.target.value });

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setForm({ ...form, logoFile: f });
    };

    // Load merchant profile using stored credentials
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            setSuccess(null);
            try {
                const stored = localStorage.getItem("merchantCredentials");
                if (!stored) {
                    setError(
                        "Missing merchant credentials. Please register merchant first."
                    );
                    return;
                }
                const creds: MerchantCredentials = JSON.parse(stored);
                merchantAPI.setCredentials(creds);

                const [profileRes, settingsRes] = await Promise.all([
                    merchantAPI.getProfile(),
                    merchantAPI.getSettings(),
                ]);
                if (profileRes.success && profileRes.data) {
                    const p = profileRes.data;
                    setForm({
                        businessName: p.merchantName || "",
                        businessType: p.businessType || "",
                        address: [
                            p.address?.street,
                            p.address?.city,
                            p.address?.state,
                            p.address?.country,
                            p.address?.postalCode,
                        ]
                            .filter(Boolean)
                            .join(", "),
                        taxId: "",
                        email: p.email || "",
                        phone: p.phoneNumber || "",
                        description: "",
                        walletAddress: p.walletAddress || "",
                        settlementPeriod:
                            (settingsRes.success &&
                                (settingsRes.data
                                    ?.settlementPeriod as Period)) ||
                            "daily",
                        webhookUrl:
                            (settingsRes.success &&
                                (settingsRes.data?.webhookUrl as string)) ||
                            "",
                        logoFile: null,
                    });
                } else {
                    setError(
                        profileRes.error || "Failed to load merchant profile"
                    );
                }
            } catch (err) {
                if (err instanceof AxiosError) {
                    setError(err.response?.data?.message || err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load merchant profile");
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const onSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            // Map the simple textarea address to structured fields (best-effort split)
            const parts = form.address.split(",").map((s) => s.trim());
            const [street, city, state, country, postalCode] = [
                parts[0] || "",
                parts[1] || "",
                parts[2] || "",
                parts[3] || "",
                parts[4] || "",
            ];

            const updateProfileRes = await merchantAPI.updateProfile({
                merchantName: form.businessName,
                businessType: form.businessType,
                email: form.email,
                phoneNumber: form.phone,
                address: { street, city, state, country, postalCode },
            } as MerchantProfile);
            const updateSettingsRes = await merchantAPI.updateSettings({
                webhookUrl: form.webhookUrl,
                settlementPeriod: form.settlementPeriod,
            });

            if (updateProfileRes.success && updateSettingsRes.success) {
                setSuccess("Settings saved successfully");
            } else {
                setError(
                    updateProfileRes.error ||
                        updateSettingsRes.error ||
                        "Failed to save settings"
                );
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to save settings");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-6">
            <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
                <h3 className="font-extrabold tracking-wide mb-4 flex items-center gap-2">
                    <span className="text-xl">STORE INFORMATION</span>
                </h3>

                {/* Status banners */}
                {error && (
                    <div className="mb-4 p-3 border-2 border-red-500 bg-red-50 text-sm font-bold text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 border-2 border-green-600 bg-green-50 text-sm font-bold text-green-700">
                        {success}
                    </div>
                )}

                <div className="space-y-4 opacity-100">
                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            BUSINESS NAME
                        </div>
                        <Input
                            value={form.businessName}
                            onChange={onChange("businessName")}
                            className="border-4 border-black"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            BUSINESS TYPE
                        </div>
                        <Input
                            value={form.businessType}
                            onChange={onChange("businessType")}
                            className="border-4 border-black"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            ADDRESS
                        </div>
                        <textarea
                            value={form.address}
                            onChange={onChange("address")}
                            className="w-full min-h-[84px] border-4 border-black p-2 text-sm"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">TAX ID</div>
                        <Input
                            value={form.taxId}
                            onChange={onChange("taxId")}
                            className="border-4 border-black"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">EMAIL</div>
                        <Input
                            value={form.email}
                            onChange={onChange("email")}
                            className="border-4 border-black"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">PHONE</div>
                        <Input
                            value={form.phone}
                            onChange={onChange("phone")}
                            className="border-4 border-black"
                        />
                    </div>

                    {/* Wallet address (read-only) */}
                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            WALLET ADDRESS
                        </div>
                        <Input
                            value={form.walletAddress}
                            readOnly
                            className="border-4 border-black bg-gray-100"
                        />
                    </div>

                    {/* Webhook + Settlement */}
                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            WEBHOOK URL
                        </div>
                        <Input
                            value={form.webhookUrl}
                            onChange={onChange("webhookUrl")}
                            className="border-4 border-black"
                            placeholder="https://your-domain.com/webhook"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            SETTLEMENT PERIOD
                        </div>
                        <select
                            value={form.settlementPeriod}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    settlementPeriod: e.target.value as
                                        | "daily"
                                        | "weekly"
                                        | "monthly",
                                })
                            }
                            className="w-full p-2 border-4 border-black bg-white text-sm"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-1">
                            STORE DESCRIPTION
                        </div>
                        <textarea
                            value={form.description}
                            onChange={onChange("description")}
                            className="w-full min-h-[110px] border-4 border-black p-2 text-sm"
                        />
                    </div>

                    <div>
                        <div className="text-[11px] font-bold mb-2">
                            STORE LOGO
                        </div>
                        <div className="border-4 border-dotted border-black p-6 text-center">
                            <div className="text-2xl mb-2">⬆️</div>
                            <div className="text-[11px] font-bold">
                                UPLOAD LOGO
                            </div>
                            <div className="text-[10px] text-gray-600 mb-3">
                                Drag & drop or click to select
                            </div>
                            <label className="inline-block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onSelectFile}
                                    className="hidden"
                                />
                                <span className="inline-block px-4 py-2 border-2 border-black bg-white text-sm font-bold cursor-pointer">
                                    SELECT FILE
                                </span>
                            </label>
                            {form.logoFile && (
                                <div className="mt-2 text-xs">
                                    Selected: {form.logoFile.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            disabled={saving || loading}
                            onClick={onSave}
                            className="w-full border-4 border-black bg-[#16a34a] hover:bg-[#16a34a]/90 font-extrabold disabled:opacity-60"
                        >
                            {saving ? "SAVING..." : "SAVE SETTINGS"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
