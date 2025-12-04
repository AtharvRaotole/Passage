"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink
} from "lucide-react";

interface AssetResult {
  platform: string;
  type: string;
  address?: string;
  balance?: string;
  status: "found" | "not_found" | "pending";
}

export default function RecoveryPage() {
  const { authenticated, user, login, logout } = usePrivy();
  const [isSearching, setIsSearching] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchAddress) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API call to scan for assets
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock results
    setResults([
      { platform: "Ethereum Mainnet", type: "ETH", balance: "0.05 ETH", status: "found" },
      { platform: "Polygon", type: "MATIC", balance: "12.5 MATIC", status: "found" },
      { platform: "Uniswap", type: "LP Position", status: "not_found" },
      { platform: "Aave", type: "Lending", status: "not_found" },
    ]);
    
    setIsSearching(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Asset Recovery</h1>
          <p className="text-neutral-500 mb-8">Sign in to scan for unclaimed assets</p>
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
            <h1 className="text-xl font-semibold">Asset Recovery</h1>
          </div>
          <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Scan for Assets</h2>
            <p className="text-sm text-neutral-500">
              Enter a wallet address to scan for forgotten or unclaimed digital assets across multiple chains and protocols.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchAddress}
              className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan"
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Scan Results</h2>
            
            {isSearching ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">Scanning blockchain networks...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl ${
                      result.status === "found" ? "bg-emerald-50" : "bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          result.status === "found" ? "bg-emerald-100" : "bg-neutral-200"
                        }`}>
                          {result.status === "found" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900">{result.platform}</h4>
                          <p className="text-sm text-neutral-500">{result.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {result.balance ? (
                          <p className="font-medium text-emerald-700">{result.balance}</p>
                        ) : (
                          <p className="text-sm text-neutral-400">No assets found</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-neutral-500">No assets found</p>
              </div>
            )}
          </div>
        )}

        {/* Supported Networks */}
        <div className="bg-neutral-100 rounded-2xl p-6">
          <h3 className="font-medium text-neutral-900 mb-4">Supported Networks & Protocols</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Ethereum", "Polygon", "Arbitrum", "Base", "Uniswap", "Aave", "Compound", "OpenSea"].map((network) => (
              <div key={network} className="flex items-center gap-2 text-sm text-neutral-600">
                <div className="w-2 h-2 bg-neutral-400 rounded-full" />
                {network}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
