'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { 
  mainnet, 
  sepolia, 
  polygonMumbai, 
  polygon,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia
} from 'wagmi/chains'
import { useState, useMemo } from 'react'

import '@rainbow-me/rainbowkit/styles.css'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  const config = useMemo(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
    if (!projectId) {
      console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set')
    }
    
    return getDefaultConfig({
      appName: 'Project Charon',
      projectId: projectId || 'YOUR_PROJECT_ID',
      chains: [
        mainnet, 
        sepolia, 
        polygon, 
        polygonMumbai,
        arbitrum,
        arbitrumSepolia,
        base,
        baseSepolia
      ],
      ssr: true,
    })
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

