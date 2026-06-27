"use client";

import { useCallback, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Smartphone, Wallet, Loader2, AlertCircle } from "lucide-react";
import { WalletPassPreview } from "./WalletPassPreview";
import { PulseQRCode } from "./PulseQRCode";
import { getPulseUrl } from "@/lib/pulseUtils";

interface AddToWalletSectionProps {
  displayName?: string | null;
  lastSeen?: number | null;
}

export function AddToWalletSection({
  displayName,
  lastSeen,
}: AddToWalletSectionProps) {
  const { getAccessToken, authenticated } = usePrivy();
  const [isDownloading, setIsDownloading] = useState(false);
  const [walletPassAvailable, setWalletPassAvailable] = useState<boolean | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const pulseUrl = getPulseUrl();

  const handleAddToAppleWallet = useCallback(async () => {
    if (!authenticated) return;

    setIsDownloading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Please sign in again to add your pass.");
      }

      const response = await fetch("/api/wallet-pass", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 503) {
        setWalletPassAvailable(false);
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate wallet pass");
      }

      setWalletPassAvailable(true);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "passage-checkin.pkpass";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDownloading(false);
    }
  }, [authenticated, getAccessToken]);

  const showFallback = walletPassAvailable === false;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Wallet Check-in
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Add your Passage card to Apple Wallet, then tap it to open a
            one-tap check-in on your phone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <WalletPassPreview displayName={displayName} lastSeen={lastSeen} />

        <div className="flex flex-col items-center lg:items-start gap-6">
          {!showFallback && (
            <button
              type="button"
              onClick={handleAddToAppleWallet}
              disabled={!authenticated || isDownloading}
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing pass...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Add to Apple Wallet
                </>
              )}
            </button>
          )}

          {showFallback && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4 w-full">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Apple Wallet passes are not configured yet. Scan the QR code or
                add this page to your home screen for the same check-in flow.
              </p>
            </div>
          )}

          <div className="w-full border-t border-neutral-100 pt-6">
            <p className="text-sm font-medium text-neutral-900 mb-4 text-center lg:text-left">
              Or scan to check in
            </p>
            <div className="flex justify-center lg:justify-start">
              <PulseQRCode url={pulseUrl} />
            </div>
          </div>

          <div className="w-full bg-neutral-50 rounded-xl p-4 border border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-neutral-500" />
              <p className="text-sm font-medium text-neutral-900">
                Add to Home Screen
              </p>
            </div>
            <ol className="text-sm text-neutral-500 space-y-1 list-decimal list-inside">
              <li>Open {pulseUrl} in Safari or Chrome</li>
              <li>Tap Share → Add to Home Screen</li>
              <li>Use the icon like an app for quick check-ins</li>
            </ol>
          </div>

          {error && (
            <p className="text-sm text-red-600 w-full">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
