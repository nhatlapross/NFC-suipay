'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function MerchantSettings() {
  const [form, setForm] = useState({
    businessName: 'Coffee Corner Cafe',
    businessType: 'Cafe',
    address:
      '123 Main Street, Downtown District\n123 Main Street, Downtown District',
    taxId: 'TAX_ID_123456789',
    email: 'owner@coffeecorner.com',
    phone: '+1 (555) 123-4567',
    description:
      'A cozy neighborhood cafe serving premium coffee and fresh pastries.\nA cozy neighborhood cafe serving premium coffee and fresh pastries.',
    logoFile: null as File | null,
  });

  const onChange = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setForm({ ...form, logoFile: f });
  };

  const onSave = async () => {
    // Placeholder: integrate with backend merchant profile update
    console.log('Saving settings', form);
    alert('Settings saved (mock)');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Card className="p-4 border-4 border-black shadow-[8px_8px_0_black]">
        <h3 className="font-extrabold tracking-wide mb-4 flex items-center gap-2">
          <span className="text-xl">STORE INFORMATION</span>
        </h3>

        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold mb-1">BUSINESS NAME</div>
            <Input value={form.businessName} onChange={onChange('businessName')} className="border-4 border-black" />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1">BUSINESS TYPE</div>
            <Input value={form.businessType} onChange={onChange('businessType')} className="border-4 border-black" />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1">ADDRESS</div>
            <textarea
              value={form.address}
              onChange={onChange('address') as any}
              className="w-full min-h-[84px] border-4 border-black p-2 text-sm"
            />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1">TAX ID</div>
            <Input value={form.taxId} onChange={onChange('taxId')} className="border-4 border-black" />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1">EMAIL</div>
            <Input value={form.email} onChange={onChange('email')} className="border-4 border-black" />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1">PHONE</div>
            <Input value={form.phone} onChange={onChange('phone')} className="border-4 border-black" />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-1">STORE DESCRIPTION</div>
            <textarea
              value={form.description}
              onChange={onChange('description') as any}
              className="w-full min-h-[110px] border-4 border-black p-2 text-sm"
            />
          </div>

          <div>
            <div className="text-[11px] font-bold mb-2">STORE LOGO</div>
            <div className="border-4 border-dotted border-black p-6 text-center">
              <div className="text-2xl mb-2">⬆️</div>
              <div className="text-[11px] font-bold">UPLOAD LOGO</div>
              <div className="text-[10px] text-gray-600 mb-3">Drag & drop or click to select</div>
              <label className="inline-block">
                <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                <span className="inline-block px-4 py-2 border-2 border-black bg-white text-sm font-bold cursor-pointer">SELECT FILE</span>
              </label>
              {form.logoFile && (
                <div className="mt-2 text-xs">Selected: {form.logoFile.name}</div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={onSave} className="w-full border-4 border-black bg-[#16a34a] hover:bg-[#16a34a]/90 font-extrabold">
              SAVE SETTINGS
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


