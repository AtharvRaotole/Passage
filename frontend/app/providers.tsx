'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { createConfig } from '@privy-io/wagmi'
import { http } from 'viem'
import { 
  mainnet, 
  sepolia, 
  polygon,
  arbitrum,
  base,
} from 'viem/chains'
import { useState } from 'react'

// Create wagmi config
const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, base],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // If no Privy appId, just wrap with QueryClientProvider
  if (!appId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set')
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#1a1a1a',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        supportedChains: [mainnet, sepolia, polygon, arbitrum, base],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
