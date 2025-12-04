"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { 
  ASSET_TRANSFER_ABI, 
  ASSET_TRANSFER_ADDRESS,
  ERC20_ABI,
  CHARON_SWITCH_ABI,
  CHARON_SWITCH_ADDRESS,
  UserStatus
} from "@/lib/contracts";
import { formatUnits, parseUnits, isAddress } from "viem";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Wallet, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Lock,
  ArrowDownToLine
} from "lucide-react";

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

export default function CryptoVaultPage() {
  const { authenticated, user, login, logout } = usePrivy();
  const { address, chainId } = useAccount();
  const walletAddress = address || user?.wallet?.address;
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [newBeneficiary, setNewBeneficiary] = useState({ address: "", percentage: "" });
  const [depositToken, setDepositToken] = useState({ address: "", amount: "" });
  const [portfolioValue, setPortfolioValue] = useState<{ totalUSD: number; tokens: TokenInfo[] }>({ totalUSD: 0, tokens: [] });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { data: userInfo } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: { enabled: !!walletAddress && authenticated },
  });

  const { data: assetSummary, refetch: refetchAssets } = useReadContract({
    address: ASSET_TRANSFER_ADDRESS,
    abi: ASSET_TRANSFER_ABI,
    functionName: "getUserAssetSummary",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: { enabled: !!walletAddress && authenticated },
  });

  useEffect(() => {
    if (assetSummary && assetSummary[2] && assetSummary[2].length > 0) {
      setIsInitialized(true);
      const bens = assetSummary[2].map((b: any) => ({
        address: b.beneficiaryAddress,
        percentage: Number(b.percentage) / 100,
        isActive: b.isActive,
      }));
      setBeneficiaries(bens);
    }
  }, [assetSummary]);

  const handleInitializeBeneficiaries = () => {
    if (!walletAddress || beneficiaries.length === 0) return;
    
    const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert("Total percentage must equal 100%");
      return;
    }

    const beneficiaryAddresses = beneficiaries.map((b) => b.address as `0x${string}`);
    const percentages = beneficiaries.map((b) => BigInt(Math.round(b.percentage * 100)));

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

    setBeneficiaries([...beneficiaries, { address: newBeneficiary.address, percentage, isActive: true }]);
    setNewBeneficiary({ address: "", percentage: "" });
    setShowAddBeneficiary(false);
  };

  const status = userInfo?.[0] !== undefined ? Number(userInfo[0]) : null;
  const isDeceased = status === UserStatus.DECEASED;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Crypto Vault</h1>
          <p className="text-neutral-500 mb-8">Sign in to manage your digital assets</p>
          <button
            onClick={login}
            className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <h1 className="text-xl font-semibold">Crypto Vault</h1>
          </div>
          <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Warning Banner */}
        {isDeceased && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Status: Triggered</h3>
              <p className="text-sm text-red-700">Assets can now be transferred to beneficiaries.</p>
            </div>
          </div>
        )}

        {/* Portfolio Overview */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total Portfolio Value</p>
              <p className="text-4xl font-semibold text-neutral-900">
                ${portfolioValue.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-neutral-600" />
            </div>
          </div>
          
          {portfolioValue.tokens.length > 0 ? (
            <div className="space-y-3">
              {portfolioValue.tokens.map((token, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-neutral-200">
                      <span className="text-sm font-medium">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{token.symbol}</p>
                      <p className="text-sm text-neutral-500">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-neutral-900">
                      {formatUnits(token.balance, token.decimals)}
                    </p>
                    {token.usdValue && (
                      <p className="text-sm text-neutral-500">${token.usdValue.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500">No tokens deposited yet</p>
            </div>
          )}
        </div>

        {/* Beneficiaries */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Beneficiaries</h2>
              <p className="text-sm text-neutral-500">Who receives your assets</p>
            </div>
            {!isInitialized && (
              <button
                onClick={() => setShowAddBeneficiary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          {showAddBeneficiary && !isInitialized && (
            <div className="mb-6 p-4 bg-neutral-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={newBeneficiary.address}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, address: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Percentage</label>
                <input
                  type="number"
                  value={newBeneficiary.percentage}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, percentage: e.target.value })}
                  placeholder="50"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddBeneficiary(false)}
                  className="flex-1 py-2 border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBeneficiary}
                  className="flex-1 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {beneficiaries.length > 0 ? (
            <div className="space-y-3">
              {beneficiaries.map((ben, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-neutral-200">
                      <Users className="w-5 h-5 text-neutral-600" />
                    </div>
                    <p className="font-mono text-sm text-neutral-700">
                      {ben.address.slice(0, 8)}...{ben.address.slice(-6)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                    {ben.percentage}%
                  </span>
                </div>
              ))}
              
              {!isInitialized && beneficiaries.length > 0 && (
                <button
                  onClick={handleInitializeBeneficiaries}
                  disabled={isPending || isConfirming}
                  className="w-full mt-4 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(isPending || isConfirming) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Confirm Beneficiaries
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500">No beneficiaries added</p>
              <p className="text-sm text-neutral-400">Add people who will receive your assets</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
