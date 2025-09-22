"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import merchantAPI, {
    MerchantCredentials,
    Transaction as MerchantTx,
} from "@/lib/merchant-api";

type UiStatus = "PAID" | "PENDING" | "CANCELLED";
type FilterStatus = "ALL" | UiStatus;

interface ExtendedTransaction extends MerchantTx {
    type?: string;
}

export default function TransactionManagement() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<FilterStatus>("ALL");
    const [selected, setSelected] = useState<ExtendedTransaction | null>(null);
    const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = async (pageNum = page, pageSize = limit) => {
        try {
            setLoading(true);
            setError(null);
            const stored = localStorage.getItem("merchantCredentials");
            if (!stored) {
                setError("Missing merchant credentials");
                return;
            }
            const creds: MerchantCredentials = JSON.parse(stored);
            merchantAPI.setCredentials(creds);
            const res = await merchantAPI.getPayments(pageNum, pageSize);
            if (res.success && res.data) {
                setTransactions(res.data.payments || []);
                const pag = res.data.pagination || {
                    current: pageNum,
                    total: 0,
                    count: 0,
                    limit: pageSize,
                };
                setTotal(pag.total || 0);
            } else {
                setError(res.error || "Failed to load transactions");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, limit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const filtered = useMemo(() => {
        const mapStatus = (s?: string): UiStatus =>
            s === "completed"
                ? "PAID"
                : s === "pending"
                ? "PENDING"
                : "CANCELLED";
        return transactions.filter((tx) => {
            const id = tx.transactionId || tx._id || "";
            const name = tx.customerName || "";
            const matchQuery = (id + " " + name)
                .toLowerCase()
                .includes(query.toLowerCase());
            const matchStatus =
                status === "ALL" ? true : mapStatus(tx.status) === status;
            return matchQuery && matchStatus;
        });
    }, [query, status, transactions]);

    const exportCsv = () => {
        const header = "id,customer,amount,date,type,status\n";
        const rows = filtered
            .map((t) => {
                const id = t.transactionId || t._id;
                const customer = t.customerName || "";
                const amount = t.amount;
                const date = t.createdAt;
                const type = t.type || "N/A";
                const statusText = t.status;
                return `${id},${customer},${amount},${date},${type},${statusText}`;
            })
            .join("\n");
        const blob = new Blob([header + rows], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const StatusBadge = ({ s }: { s: UiStatus }) => {
        const styles =
            s === "PAID"
                ? "bg-green-100 text-green-700 border-green-700"
                : s === "PENDING"
                ? "bg-yellow-100 text-yellow-800 border-yellow-800"
                : "bg-red-100 text-red-700 border-red-700";
        return (
            <span
                className={`px-2 py-0.5 text-[10px] font-extrabold border ${styles}`}
            >
                {s}
            </span>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Management Bar */}
            <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
                <h3 className="font-extrabold tracking-wide mb-3">
                    TRANSACTION MANAGEMENT
                </h3>
                <div className="flex flex-col gap-3">
                    <Input
                        placeholder="Search by Customer Name or Transaction ID"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border-4 border-black"
                    />
                    <div className="flex gap-3">
                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as FilterStatus)
                            }
                            className="border-4 border-black px-3 py-2 text-sm font-bold bg-white"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PAID">Paid</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <Button
                            onClick={exportCsv}
                            className="border-4 border-black bg-[#00e676] hover:bg-[#00e676]/90 font-extrabold"
                        >
                            EXPORT CSV
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Error/Loading */}
            {error && (
                <Card className="p-3 border-4 border-black bg-red-50 text-red-700 font-bold">
                    {error}
                </Card>
            )}
            {loading && (
                <Card className="p-3 border-4 border-black text-sm">
                    Loading transactions...
                </Card>
            )}

            {/* List and Details */}
            <div className="grid grid-cols-1 gap-5">
                <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
                    <h4 className="font-extrabold tracking-wide mb-3">
                        TRANSACTIONS ({filtered.length})
                    </h4>
                    <div className="space-y-3">
                        {filtered.map((tx) => (
                            <div
                                key={tx._id}
                                className="border-2 border-black p-3 bg-white"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 border-2 border-black ${
                                                tx.currency === "SUI"
                                                    ? "bg-[#ff005c]"
                                                    : "bg-[#00f0ff]"
                                            }`}
                                        ></div>
                                        <span className="font-extrabold text-sm">
                                            {tx.transactionId || tx._id}
                                        </span>
                                    </div>
                                    <StatusBadge
                                        s={
                                            tx.status === "completed"
                                                ? "PAID"
                                                : tx.status === "pending"
                                                ? "PENDING"
                                                : "CANCELLED"
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 text-xs text-gray-700">
                                    <div>Customer:</div>
                                    <div className="text-black font-bold text-right">
                                        {tx.customerName || "-"}
                                    </div>
                                    <div>Amount:</div>
                                    <div className="text-black font-bold text-right">
                                        {Number(tx.amount).toFixed(2)}{" "}
                                        {tx.currency || "SUI"}
                                    </div>
                                    <div>Date/Time:</div>
                                    <div className="text-right">
                                        {new Date(
                                            tx.createdAt
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Button
                                        onClick={() => setSelected(tx)}
                                        variant="outline"
                                        className="border-2 border-black text-xs font-bold"
                                    >
                                        VIEW DETAILS
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4">
                        <div className="text-xs">Total: {total}</div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="border-2 border-black text-xs font-bold"
                                disabled={page === 1 || loading}
                                onClick={() => {
                                    const p = Math.max(1, page - 1);
                                    setPage(p);
                                    load(p, limit);
                                }}
                            >
                                Prev
                            </Button>
                            <span className="text-xs font-bold">
                                Page {page}
                            </span>
                            <Button
                                variant="outline"
                                className="border-2 border-black text-xs font-bold"
                                disabled={
                                    loading ||
                                    filtered.length === 0 ||
                                    page * limit >= total
                                }
                                onClick={() => {
                                    const p = page + 1;
                                    setPage(p);
                                    load(p, limit);
                                }}
                            >
                                Next
                            </Button>
                            <select
                                value={limit}
                                onChange={(e) =>
                                    setLimit(Number(e.target.value))
                                }
                                className="border-2 border-black text-xs px-2 py-1 bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </Card>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 bg-black/40 p-4 md:p-8 flex items-start justify-center">
                    <div className="w-full max-w-lg">
                        <Card className="p-4 border-4 border-black shadow-[12px_12px_0_black] bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-extrabold tracking-wide">
                                    TRANSACTION DETAILS
                                </h4>
                                <Button
                                    onClick={() => setSelected(null)}
                                    variant="outline"
                                    className="border-2 border-black text-xs font-bold"
                                >
                                    CLOSE
                                </Button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2">
                                    <div>TRANSACTION ID</div>
                                    <div className="font-bold text-right">
                                        {selected.transactionId || selected._id}
                                    </div>
                                    <div>TYPE</div>
                                    <div className="text-right font-bold">
                                        {selected.type || "N/A"}
                                    </div>
                                    <div>CUSTOMER NAME</div>
                                    <div className="font-bold text-right">
                                        {selected.customerName || "-"}
                                    </div>
                                    <div>AMOUNT</div>
                                    <div className="font-bold text-right">
                                        {Number(selected.amount).toFixed(2)}{" "}
                                        {selected.currency || "SUI"}
                                    </div>
                                    <div>STATUS</div>
                                    <div className="text-right">
                                        <StatusBadge
                                            s={
                                                selected.status === "completed"
                                                    ? "PAID"
                                                    : selected.status ===
                                                      "pending"
                                                    ? "PENDING"
                                                    : "CANCELLED"
                                            }
                                        />
                                    </div>
                                    <div>DATE & TIME</div>
                                    <div className="text-right">
                                        {new Date(
                                            selected.createdAt
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-xs mb-1">
                                        QR CODE DATA
                                    </div>
                                    <Input
                                        readOnly
                                        value={`QR_CODE_DATA_${
                                            selected.transactionId ||
                                            selected._id
                                        }`}
                                        className="border-2 border-black"
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-xs mb-1">
                                        NOTES
                                    </div>
                                    <Input
                                        readOnly
                                        value="Coffee and pastry purchase"
                                        className="border-2 border-black"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
