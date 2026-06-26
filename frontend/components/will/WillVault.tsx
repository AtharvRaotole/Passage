"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { FileText, Loader2, Lock, ShieldAlert } from "lucide-react";
import { useDigitalWills } from "@/hooks/useDigitalWills";
import { WillEntryForm } from "@/components/will/WillEntryForm";
import { WillEntryCard } from "@/components/will/WillEntryCard";
import {
  clearLegacyLocalCredentials,
  hasLegacyLocalCredentials,
} from "@/utils/willStorage";
import { prefetchLitClient } from "@/utils/litCharon";

export function WillVault() {
  const { address, isConnected } = useAccount();
  const {
    wills,
    isLoading,
    addWill,
    removeWill,
    isSaving,
    isDeleting,
    isLitEnabled,
    error,
  } = useDigitalWills();
  const [legacyBanner, setLegacyBanner] = useState(false);

  useEffect(() => {
    prefetchLitClient();
    setLegacyBanner(hasLegacyLocalCredentials());
  }, []);

  if (!isConnected || !address) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto mb-3" />
        <p className="text-amber-900 font-medium">Connect your wallet</p>
        <p className="text-sm text-amber-700 mt-1">
          Wallet connection is required to encrypt and sign will entries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border ${
          isLitEnabled
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <Lock
          className={`w-5 h-5 mt-0.5 shrink-0 ${
            isLitEnabled ? "text-emerald-600" : "text-amber-600"
          }`}
        />
        <div className="text-sm">
          {isLitEnabled ? (
            <p className="text-emerald-900">
              Credentials are encrypted with Lit Protocol before leaving your browser.
              They unlock only when your CharonSwitch status is <strong>DECEASED</strong>.
            </p>
          ) : (
            <p className="text-amber-900">
              <strong>Dev mode:</strong> Lit encryption is disabled (
              <code className="text-xs">NEXT_PUBLIC_WILL_SKIP_LIT=true</code>).
              Do not use real passwords until Lit is configured.
            </p>
          )}
        </div>
      </div>

      {legacyBanner && (
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <p className="text-sm text-neutral-700">
            Legacy local credentials were found in your browser. They were stored
            unencrypted — please re-add them here, then dismiss this notice.
          </p>
          <button
            type="button"
            onClick={() => {
              clearLegacyLocalCredentials();
              setLegacyBanner(false);
            }}
            className="text-sm text-neutral-900 font-medium whitespace-nowrap hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <WillEntryForm
        onSubmit={async (entry) => {
          await addWill(entry);
        }}
        isSaving={isSaving}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 text-sm">
          Failed to load wills. Is the backend running?
        </div>
      ) : wills.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No credentials saved yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Add accounts your executor should access after verification
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {wills.map((entry) => (
            <WillEntryCard
              key={entry.id}
              entry={entry}
              onDelete={removeWill}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
