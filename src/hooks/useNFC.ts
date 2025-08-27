import { useState, useCallback, useEffect } from 'react';
import { NFCData } from '@/types';

export function useNFC() {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nfcData, setNfcData] = useState<NFCData | null>(null);
  const [error, setError] = useState('');
  const [ndefReader, setNdefReader] = useState<any>(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError('NFC không được hỗ trợ trên thiết bị này');
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError('NFC không được hỗ trợ');
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      
      setNdefReader(ndef);
      setIsScanning(true);
      setError('');
      setNfcData(null);

      ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
        console.log('NFC Tag detected:', serialNumber);
        
        const records = [];
        for (const record of message.records) {
          const decoder = new TextDecoder();
          records.push({
            recordType: record.recordType,
            data: decoder.decode(record.data),
          });
        }

        setNfcData({
          uuid: serialNumber,
          timestamp: new Date().toISOString(),
          records,
        });
        setIsScanning(false);
      });

      ndef.addEventListener('readingerror', () => {
        setError('Không thể đọc thẻ NFC. Vui lòng thử lại.');
        setIsScanning(false);
      });

    } catch (err: any) {
      console.error('NFC scan error:', err);
      setError(err.message || 'Lỗi khi quét NFC');
      setIsScanning(false);
    }
  }, [isSupported]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    setNfcData(null);
    if (ndefReader) {
      // Clean up event listeners if needed
      setNdefReader(null);
    }
  }, [ndefReader]);

  return {
    isSupported,
    isScanning,
    nfcData,
    error,
    startScan,
    stopScan,
  };
}