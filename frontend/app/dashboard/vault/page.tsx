"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  ASSET_TRANSFER_ABI, 
  ASSET_TRANSFER_ADDRESS,
  ERC20_ABI,
  CHARON_SWITCH_ABI,
  CHARON_SWITCH_ADDRESS,
  UserStatus
} from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUnits, parseUnits, isAddress } from "viem";
import axios from "axios";
import { encryptCredential } from "@/utils/litCharon";

interface Beneficiary {
  address: string;
  percentage: number;
  isActive: boolean;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  balance: bigint;
  decimals: number;
  usdValue?: number;
}

interface PortfolioValue {
  totalUSD: number;
  tokens: TokenInfo[];
}

// Common token addresses (testnet/mainnet)
const COMMON_TOKENS: Record<number, Record<string, { address: string; symbol: string; name: string; decimals: number }>> = {
  1: { // Ethereum Mainnet
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
    DAI: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  },
  11155111: { // Sepolia
    USDC: { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC", name: "USD Coin", decimals: 6 },
  },
  137: { // Polygon
    USDC: { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", name: "USD Coin", decimals: 6 },
    USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", name: "Tether USD", decimals: 6 },
  },
  42161: { // Arbitrum
    USDC: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", name: "USD Coin", decimals: 6 },
  },
  8453: { // Base
    USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", name: "USD Coin", decimals: 6 },
  },
};

export default function CryptoVaultPage() {
  const { address, isConnected, chainId } = useAccount();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [newBeneficiary, setNewBeneficiary] = useState({ address: "", percentage: "" });
  const [depositToken, setDepositToken] = useState({ address: "", amount: "" });
  const [portfolioValue, setPortfolioValue] = useState<PortfolioValue>({ totalUSD: 0, tokens: [] });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [hardwareWalletSeed, setHardwareWalletSeed] = useState("");
  const [showHardwareWallet, setShowHardwareWallet] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read user status from CharonSwitch
  const { data: userInfo } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Read asset summary
  const { data: assetSummary, refetch: refetchAssets } = useReadContract({
    address: ASSET_TRANSFER_ADDRESS,
    abi: ASSET_TRANSFER_ABI,
    functionName: "getUserAssetSummary",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isInitialized },
  });

  // Check if initialized
  useEffect(() => {
    if (assetSummary && assetSummary[2] && assetSummary[2].length > 0) {
      setIsInitialized(true);
      const bens = assetSummary[2].map((b: any) => ({
        address: b.beneficiaryAddress,
        percentage: Number(b.percentage) / 100, // Convert from basis points
        isActive: b.isActive,
      }));
      setBeneficiaries(bens);
    }
  }, [assetSummary]);

  // Fetch portfolio value from CoinGecko
  const fetchPortfolioValue = useCallback(async () => {
    if (!assetSummary || !chainId) return;

    setIsLoadingPortfolio(true);
    try {
      const tokens = assetSummary[0] as string[];
      const balances = assetSummary[1] as bigint[];
      const tokenInfos: TokenInfo[] = [];

      // Get token info for each token
      for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        const balance = balances[i];

        try {
          // Try to read token info from contract
          // For production, use wagmi hooks or public client
          let tokenData = { symbol: 'TOKEN', name: 'Token', decimals: 18 };
          
          // Try to get from common tokens list
          const commonTokens = COMMON_TOKENS[chainId || 1] || {};
          const tokenKey = Object.keys(commonTokens).find(
            key => commonTokens[key].address.toLowerCase() === tokenAddress.toLowerCase()
          );
          
          if (tokenKey) {
            tokenData = {
              symbol: commonTokens[tokenKey].symbol,
              name: commonTokens[tokenKey].name,
              decimals: commonTokens[tokenKey].decimals,
            };
          } else {
            // Try to read from contract (simplified - in production use proper hooks)
            tokenData = await readTokenInfo(tokenAddress);
          }

          const tokenInfo: TokenInfo = {
            address: tokenAddress,
            symbol: tokenData.symbol,
            name: tokenData.name,
            balance,
            decimals: tokenData.decimals,
          };

            // Get USD price from CoinGecko
          try {
            const chainName = getChainName(chainId);
            const response = await axios.get(
              `https://api.coingecko.com/api/v3/simple/token_price/${chainName}`,
              {
                params: {
                  contract_addresses: tokenAddress.toLowerCase(),
                  vs_currencies: "usd",
                },
                timeout: 5000,
              }
            );

            const priceData = response.data[tokenAddress.toLowerCase()];
            if (priceData && priceData.usd) {
              const balanceFormatted = parseFloat(formatUnits(balance, tokenInfo.decimals));
              tokenInfo.usdValue = balanceFormatted * priceData.usd;
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${tokenAddress}:`, error);
            // Try alternative: use symbol-based lookup for common tokens
            if (tokenInfo.symbol && ['USDC', 'USDT', 'DAI'].includes(tokenInfo.symbol)) {
              try {
                const response = await axios.get(
                  `https://api.coingecko.com/api/v3/simple/price`,
                  {
                    params: {
                      ids: tokenInfo.symbol.toLowerCase(),
                      vs_currencies: "usd",
                    },
                    timeout: 5000,
                  }
                );
                const price = response.data[tokenInfo.symbol.toLowerCase()]?.usd;
                if (price) {
                  const balanceFormatted = parseFloat(formatUnits(balance, tokenInfo.decimals));
                  tokenInfo.usdValue = balanceFormatted * price;
                }
              } catch (e) {
                // Ignore fallback error
              }
            }
          }

          tokenInfos.push(tokenInfo);
        } catch (error) {
          console.error(`Failed to read token ${tokenAddress}:`, error);
        }
      }

      const totalUSD = tokenInfos.reduce((sum, token) => sum + (token.usdValue || 0), 0);
      setPortfolioValue({ totalUSD, tokens: tokenInfos });
    } catch (error) {
      console.error("Failed to fetch portfolio value:", error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [assetSummary, chainId]);

  useEffect(() => {
    if (assetSummary && isInitialized) {
      fetchPortfolioValue();
    }
  }, [assetSummary, isInitialized, fetchPortfolioValue]);

  // Helper to read token info - simplified version
  // In production, use wagmi's useReadContract hooks for each token
  const readTokenInfo = useCallback(async (tokenAddress: string) => {
    try {
      // For now, return default values
      // In production, implement proper contract reading
      // This would require dynamic wagmi hooks or a public client
      return { symbol: 'TOKEN', name: 'Token', decimals: 18 };
    } catch (error) {
      console.error('Error reading token info:', error);
      return { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 18 };
    }
  }, []);

  const getChainName = (chainId: number): string => {
    const chainMap: Record<number, string> = {
      1: "ethereum",
      11155111: "ethereum", // Sepolia uses ethereum
      137: "polygon-pos",
      80001: "polygon-pos", // Mumbai
      42161: "arbitrum-one",
      421614: "arbitrum-one", // Arbitrum Sepolia
      8453: "base",
      84532: "base", // Base Sepolia
    };
    return chainMap[chainId] || "ethereum";
  };

  const handleInitializeBeneficiaries = () => {
    if (!address) return;
    if (beneficiaries.length === 0) {
      alert("Please add at least one beneficiary");
      return;
    }

    const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert("Total percentage must equal 100%");
      return;
    }

    const beneficiaryAddresses = beneficiaries.map((b) => b.address as `0x${string}`);
    const percentages = beneficiaries.map((b) => BigInt(Math.round(b.percentage * 100))); // Convert to basis points

    writeContract({
      address: ASSET_TRANSFER_ADDRESS,
      abi: ASSET_TRANSFER_ABI,
      functionName: "initializeBeneficiaries",
      args: [beneficiaryAddresses, percentages],
    });
  };

  const handleAddBeneficiary = () => {
    if (!isAddress(newBeneficiary.address)) {
      alert("Invalid address");
      return;
    }
    const percentage = parseFloat(newBeneficiary.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      alert("Percentage must be between 0 and 100");
      return;
    }

    setBeneficiaries([...beneficiaries, { 
      address: newBeneficiary.address, 
      percentage,
      isActive: true 
    }]);
    setNewBeneficiary({ address: "", percentage: "" });
  };

  const handleDepositToken = async () => {
    if (!address || !isAddress(depositToken.address)) return;

    const amount = parseUnits(depositToken.amount, 18); // Assuming 18 decimals, should read from token

    // First approve
    writeContract({
      address: depositToken.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [ASSET_TRANSFER_ADDRESS, amount],
    });

    // Then deposit (this should be done after approval is confirmed)
    // For now, we'll do it in sequence
    setTimeout(() => {
      writeContract({
        address: ASSET_TRANSFER_ADDRESS,
        abi: ASSET_TRANSFER_ABI,
        functionName: "depositToken",
        args: [depositToken.address as `0x${string}`, amount],
      });
    }, 2000);
  };

  const handleSweepWallet = () => {
    if (!address) return;
    writeContract({
      address: ASSET_TRANSFER_ADDRESS,
      abi: ASSET_TRANSFER_ABI,
      functionName: "sweepWallet",
      args: [address],
    });
  };

  const status = userInfo?.[0] !== undefined ? userInfo[0] : null;
  const isDeceased = status === UserStatus.DECEASED;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">CRYPTO VAULT ACCESS</CardTitle>
            <CardDescription className="text-gray-400">Connect your wallet to access the vault</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#00ff00]/20 pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-[#00ff00]">CRYPTO VAULT</h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              Multi-chain asset management and inheritance system
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Status Warning */}
        {isDeceased && (
          <Card className="bg-red-900/20 border-red-500/50">
            <CardContent className="pt-6">
              <p className="text-red-400 font-mono text-lg">
                ⚠️ USER STATUS: DECEASED - Assets can be transferred to beneficiaries
              </p>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Value */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">PORTFOLIO VALUE</CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Real-time portfolio valuation via CoinGecko
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPortfolio ? (
              <p className="text-gray-400 font-mono">Loading portfolio...</p>
            ) : (
              <div>
                <p className="text-3xl font-mono font-bold text-[#00ff00] mb-4">
                  ${portfolioValue.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {portfolioValue.tokens.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {portfolioValue.tokens.map((token, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#0a0a0a] rounded">
                        <div>
                          <p className="font-mono text-[#00ff00]">{token.symbol}</p>
                          <p className="text-xs text-gray-400 font-mono">{token.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-gray-300">
                            {formatUnits(token.balance, token.decimals)}
                          </p>
                          {token.usdValue !== undefined && (
                            <p className="text-xs text-gray-400 font-mono">
                              ${token.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Beneficiaries */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">BENEFICIARIES</CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Configure asset distribution percentages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isInitialized ? (
              <>
                <div className="space-y-2">
                  <Label className="text-[#00ff00] font-mono">Beneficiary Address</Label>
                  <Input
                    value={newBeneficiary.address}
                    onChange={(e) => setNewBeneficiary({ ...newBeneficiary, address: e.target.value })}
                    placeholder="0x..."
                    className="bg-[#0a0a0a] border-[#00ff00]/20 text-[#00ff00] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#00ff00] font-mono">Percentage (%)</Label>
                  <Input
                    type="number"
                    value={newBeneficiary.percentage}
                    onChange={(e) => setNewBeneficiary({ ...newBeneficiary, percentage: e.target.value })}
                    placeholder="60"
                    className="bg-[#0a0a0a] border-[#00ff00]/20 text-[#00ff00] font-mono"
                  />
                </div>
                <Button
                  onClick={handleAddBeneficiary}
                  className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
                >
                  Add Beneficiary
                </Button>
                <div className="mt-4 space-y-2">
                  {beneficiaries.map((ben, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-[#0a0a0a] rounded">
                      <div>
                        <p className="font-mono text-[#00ff00]">{ben.address.slice(0, 10)}...{ben.address.slice(-8)}</p>
                      </div>
                      <p className="font-mono text-gray-300">{ben.percentage}%</p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleInitializeBeneficiaries}
                  disabled={isPending || isConfirming || beneficiaries.length === 0}
                  className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono mt-4"
                >
                  {isPending || isConfirming ? "Processing..." : "Initialize Beneficiaries"}
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                {beneficiaries.map((ben, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#0a0a0a] rounded">
                    <div>
                      <p className="font-mono text-[#00ff00]">{ben.address}</p>
                    </div>
                    <p className="font-mono text-gray-300">{ben.percentage}%</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Tokens */}
        {isInitialized && !isDeceased && (
          <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
            <CardHeader>
              <CardTitle className="text-[#00ff00] font-mono">DEPOSIT TOKENS</CardTitle>
              <CardDescription className="text-gray-400 font-mono">
                Deposit ERC-20 tokens into your vault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#00ff00] font-mono">Token Address</Label>
                <Input
                  value={depositToken.address}
                  onChange={(e) => setDepositToken({ ...depositToken, address: e.target.value })}
                  placeholder="0x..."
                  className="bg-[#0a0a0a] border-[#00ff00]/20 text-[#00ff00] font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#00ff00] font-mono">Amount</Label>
                <Input
                  type="number"
                  value={depositToken.amount}
                  onChange={(e) => setDepositToken({ ...depositToken, amount: e.target.value })}
                  placeholder="100.0"
                  className="bg-[#0a0a0a] border-[#00ff00]/20 text-[#00ff00] font-mono"
                />
              </div>
              <Button
                onClick={handleDepositToken}
                disabled={isPending || isConfirming}
                className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
              >
                {isPending || isConfirming ? "Processing..." : "Deposit Token"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sweep Wallet */}
        {isDeceased && (
          <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
            <CardHeader>
              <CardTitle className="text-[#00ff00] font-mono">SWEEP WALLET</CardTitle>
              <CardDescription className="text-gray-400 font-mono">
                Transfer all assets to beneficiaries in one transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSweepWallet}
                disabled={isPending || isConfirming}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-mono"
              >
                {isPending || isConfirming ? "Processing..." : "Execute Sweep"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hardware Wallet Inheritance */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">HARDWARE WALLET INHERITANCE</CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Store encrypted seed phrases that decrypt on death
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowHardwareWallet(!showHardwareWallet)}
              className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
            >
              {showHardwareWallet ? "Hide" : "Show"} Hardware Wallet Manager
            </Button>
            {showHardwareWallet && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-[#00ff00] font-mono">Seed Phrase (will be encrypted)</Label>
                  <textarea
                    value={hardwareWalletSeed}
                    onChange={(e) => setHardwareWalletSeed(e.target.value)}
                    placeholder="Enter your seed phrase (12 or 24 words)..."
                    className="w-full bg-[#0a0a0a] border border-[#00ff00]/20 text-[#00ff00] font-mono p-2 rounded min-h-[100px]"
                  />
                  <Button
                    onClick={async () => {
                      if (!address || !hardwareWalletSeed) {
                        alert("Please enter a seed phrase");
                        return;
                      }
                      try {
                        const { ciphertext } = await encryptCredential(hardwareWalletSeed, address);
                        setHardwareWalletSeed(ciphertext);
                        alert("Seed phrase encrypted! Store this encrypted value securely.");
                      } catch (error: any) {
                        alert(`Encryption failed: ${error.message}`);
                      }
                    }}
                    className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
                    disabled={!hardwareWalletSeed || !address}
                  >
                    Encrypt Seed Phrase
                  </Button>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  ⚠️ WARNING: Seed phrases are encrypted using Lit Protocol and will only decrypt when user status is DECEASED.
                  Store this encrypted value securely. Never share your unencrypted seed phrase.
                </p>
                {hardwareWalletSeed && hardwareWalletSeed.length > 200 && (
                  <div className="p-2 bg-[#0a0a0a] rounded">
                    <p className="text-xs text-gray-400 font-mono mb-1">Encrypted Value:</p>
                    <p className="text-xs text-[#00ff00] font-mono break-all">
                      {hardwareWalletSeed.substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

