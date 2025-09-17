'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type TxStatus = 'PAID' | 'PENDING' | 'CANCELLED';

interface TxItem {
  id: string;
  customer: string;
  amount: number;
  date: string; // ISO string
  type: 'NFC' | 'QR';
  status: TxStatus;
}

const MOCK_TX: TxItem[] = [
  { id: 'TXN_001', customer: 'John Doe', amount: 45.5, date: '2024-01-15T14:32:15Z', type: 'NFC', status: 'PAID' },
  { id: 'TXN_002', customer: 'Jane Smith', amount: 128.75, date: '2024-01-15T14:28:42Z', type: 'QR', status: 'PAID' },
  { id: 'TXN_003', customer: 'Mike Johnson', amount: 67.2, date: '2024-01-15T14:25:18Z', type: 'NFC', status: 'CANCELLED' },
  { id: 'TXN_004', customer: 'Sarah Wilson', amount: 234.0, date: '2024-01-15T14:22:33Z', type: 'QR', status: 'PAID' },
  { id: 'TXN_005', customer: 'Tom Brown', amount: 89.99, date: '2024-01-15T14:18:55Z', type: 'NFC', status: 'PENDING' },
];

export default function TransactionManagement() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | TxStatus>('ALL');
  const [selected, setSelected] = useState<TxItem | null>(null);

  const filtered = useMemo(() => {
    return MOCK_TX.filter((tx) => {
      const matchQuery = (tx.id + ' ' + tx.customer).toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === 'ALL' ? true : tx.status === status;
      return matchQuery && matchStatus;
    });
  }, [query, status]);

  const exportCsv = () => {
    const header = 'id,customer,amount,date,type,status\n';
    const rows = filtered
      .map((t) => `${t.id},${t.customer},${t.amount},${t.date},${t.type},${t.status}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ s }: { s: TxStatus }) => {
    const styles =
      s === 'PAID'
        ? 'bg-green-100 text-green-700 border-green-700'
        : s === 'PENDING'
        ? 'bg-yellow-100 text-yellow-800 border-yellow-800'
        : 'bg-red-100 text-red-700 border-red-700';
    return <span className={`px-2 py-0.5 text-[10px] font-extrabold border ${styles}`}>{s}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Management Bar */}
      <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
        <h3 className="font-extrabold tracking-wide mb-3">TRANSACTION MANAGEMENT</h3>
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
              onChange={(e) => setStatus(e.target.value as any)}
              className="border-4 border-black px-3 py-2 text-sm font-bold bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button onClick={exportCsv} className="border-4 border-black bg-[#00e676] hover:bg-[#00e676]/90 font-extrabold">
              EXPORT CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* List and Details */}
      <div className="grid grid-cols-1 gap-5">
        <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
          <h4 className="font-extrabold tracking-wide mb-3">TRANSACTIONS ({filtered.length})</h4>
          <div className="space-y-3">
            {filtered.map((tx) => (
              <div key={tx.id} className="border-2 border-black p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border-2 border-black ${tx.type === 'NFC' ? 'bg-[#ff005c]' : 'bg-[#00f0ff]'}`}></div>
                    <span className="font-extrabold text-sm">{tx.id}</span>
                  </div>
                  <StatusBadge s={tx.status} />
                </div>
                <div className="grid grid-cols-2 text-xs text-gray-700">
                  <div>Customer:</div>
                  <div className="text-black font-bold text-right">{tx.customer}</div>
                  <div>Amount:</div>
                  <div className="text-black font-bold text-right">{tx.amount.toFixed(2)} SUI</div>
                  <div>Date/Time:</div>
                  <div className="text-right">{new Date(tx.date).toLocaleString()}</div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button onClick={() => setSelected(tx)} variant="outline" className="border-2 border-black text-xs font-bold">
                    VIEW DETAILS
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-lg">
            <Card className="p-4 border-4 border-black shadow-[12px_12px_0_black] bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold tracking-wide">TRANSACTION DETAILS</h4>
                <Button onClick={() => setSelected(null)} variant="outline" className="border-2 border-black text-xs font-bold">CLOSE</Button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2">
                  <div>TRANSACTION ID</div>
                  <div className="font-bold text-right">{selected.id}</div>
                  <div>TYPE</div>
                  <div className="text-right font-bold">{selected.type}</div>
                  <div>CUSTOMER NAME</div>
                  <div className="font-bold text-right">{selected.customer}</div>
                  <div>AMOUNT</div>
                  <div className="font-bold text-right">{selected.amount.toFixed(2)} SUI</div>
                  <div>STATUS</div>
                  <div className="text-right"><StatusBadge s={selected.status} /></div>
                  <div>DATE & TIME</div>
                  <div className="text-right">{new Date(selected.date).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-bold text-xs mb-1">QR CODE DATA</div>
                  <Input readOnly value={`QR_CODE_DATA_${selected.id}`} className="border-2 border-black" />
                </div>
                <div>
                  <div className="font-bold text-xs mb-1">NOTES</div>
                  <Input readOnly value="Coffee and pastry purchase" className="border-2 border-black" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


