'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { createConfig } from '@privy-io/wagmi'
import { http, type Chain, type Transport } from 'viem'
import {
  mainnet,
  sepolia,
  polygon,
  arbitrum,
  base,
} from 'viem/chains'
import { useMemo, useState } from 'react'
import { UserProfileSync } from '@/components/UserProfileSync'

/** Optional dedicated RPC per chain — public defaults are slow / rate-limited. Set in .env.local */
function transportForChain(chainId: number): Transport {
  const urlById: Record<number, string | undefined> = {
    [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    [sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    [polygon.id]: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
    [arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    [base.id]: process.env.NEXT_PUBLIC_BASE_RPC_URL,
  }
  const url = urlById[chainId]
  return url ? http(url) : http()
}

/** Wagmi + Privy use the first chain as default — put NEXT_PUBLIC_DEFAULT_CHAIN_ID first. */
function orderChainsDefaultFirst(chainList: Chain[], defaultChainId?: number): [Chain, ...Chain[]] {
  if (defaultChainId == null || Number.isNaN(defaultChainId)) {
    return chainList as [Chain, ...Chain[]]
  }
  const sorted = [...chainList].sort((a, b) => {
    if (a.id === defaultChainId) return -1
    if (b.id === defaultChainId) return 1
    return 0
  })
  return sorted as [Chain, ...Chain[]]
}

function useWagmiConfig() {
  return useMemo(() => {
    const slim =
      process.env.NEXT_PUBLIC_WAGMI_SLIM === '1' ||
      process.env.NEXT_PUBLIC_WAGMI_SLIM === 'true'

    const defaultChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
      ? Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
      : undefined

    // Fewer chains = faster wagmi init & smaller surface (enable slim for demos)
    const chains = slim
      ? ([mainnet, sepolia, polygon] as const)
      : ([mainnet, sepolia, polygon, arbitrum, base] as const)

    const chainList = orderChainsDefaultFirst([...chains], defaultChainId)
    const transports = Object.fromEntries(
      chainList.map((c) => [c.id, transportForChain(c.id)])
    ) as Record<number, Transport>

    return createConfig({
      chains: chainList,
      transports,
    })
  }, [])
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  const wagmiConfig = useWagmiConfig()

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  const loginMethodsEnv = process.env.NEXT_PUBLIC_PRIVY_LOGIN_METHODS
  const loginMethods = loginMethodsEnv
    ? (loginMethodsEnv.split(',').map((s) => s.trim()) as ('email' | 'wallet' | 'google')[])
    : (['email', 'wallet'] as const)

  const slim =
    process.env.NEXT_PUBLIC_WAGMI_SLIM === '1' ||
    process.env.NEXT_PUBLIC_WAGMI_SLIM === 'true'

  const defaultChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
    ? Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
    : undefined

  const supportedChains = orderChainsDefaultFirst(
    slim ? [mainnet, sepolia, polygon] : [mainnet, sepolia, polygon, arbitrum, base],
    defaultChainId
  )

  const queryAndWagmi = (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <UserProfileSync />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )

  if (!appId) {
    console.warn(
      'NEXT_PUBLIC_PRIVY_APP_ID is not set — wallet login via Privy will not work until it is configured.'
    )
    return queryAndWagmi
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: [...loginMethods],
        appearance: {
          theme: 'light',
          accentColor: '#1a1a1a',
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        } as any,
        supportedChains: [...supportedChains],
      }}
    >
      {queryAndWagmi}
    </PrivyProvider>
  )
}
