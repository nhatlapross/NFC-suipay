import React from 'react';
import Link from 'next/link';
import { TestTube, ExternalLink } from 'lucide-react';

const TestPaymentLink: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TestTube className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">NFC Payment Tester</h3>
            <p className="text-sm text-gray-600">Test payment flow with real API</p>
          </div>
        </div>
        <Link href="/test-payment">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <span>Test</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default TestPaymentLink;