'use client';

import { SuiClientProvider, WalletProvider as DAppKitWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

export function DAppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <SuiClientProvider 
      networks={{
        testnet: { url: getFullnodeUrl('testnet') },
      }} 
      defaultNetwork="testnet"
    >
      <DAppKitWalletProvider>
        {children}
      </DAppKitWalletProvider>
    </SuiClientProvider>
  );
}
