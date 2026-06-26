"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignMessage } from "wagmi";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/utils/apiClient";

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
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchName && !searchAddress) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setRawOutput(null);
    setResults([]);

    try {
      const response = await apiFetch("/api/recovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: searchName || "Unknown",
          last_address: searchAddress || undefined,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setExecutionId(data.execution_id || null);
      setRawOutput(
        data.output ||
          JSON.stringify(data.total_assets || data.results || [], null, 2)
      );

      const assets = data.total_assets || data.results || [];
      const mapped: AssetResult[] = assets.map((r: Record<string, unknown>) => ({
        platform: String(r.source || r.platform || "MissingMoney.com"),
        type: String(r.property_type || r.type || "Unclaimed Property"),
        balance: r.value != null ? String(r.value) : r.balance != null ? String(r.balance) : undefined,
        status: "found" as const,
      }));

      if (mapped.length === 0 && data.output) {
        // Parse agent output as a single result
        setResults([{
          platform: "MissingMoney.com",
          type: "Search Complete",
          balance: undefined,
          status: "not_found",
        }]);
      } else {
        setResults(mapped);
      }
    } catch (err: any) {
      setRawOutput(`Error: ${err.message}`);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
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
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Search Unclaimed Property</h2>
            <p className="text-sm text-neutral-500">
              Our AI agent searches MissingMoney.com and unclaimed property databases for assets.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Last Known Address (optional)</label>
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="City, State or full address"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || (!searchName && !searchAddress)}
              className="w-full px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI agent searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {hasSearched && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Results</h2>
            {isSearching ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">AI agent browsing MissingMoney.com...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${result.status === "found" ? "bg-emerald-50" : "bg-neutral-50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.status === "found" ? "bg-emerald-100" : "bg-neutral-200"}`}>
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
                <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No unclaimed assets found</p>
              </div>
            )}
            {rawOutput && (
              <details className="mt-4">
                <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-600">View agent output</summary>
                <pre className="mt-2 p-4 bg-neutral-50 rounded-xl text-xs text-neutral-600 overflow-auto max-h-48 whitespace-pre-wrap">{rawOutput}</pre>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
