"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Activity, CheckCircle2, ExternalLink } from "lucide-react";
import { usePulse } from "@/hooks/usePulse";
import { PulseStatusDisplay } from "@/components/pulse/PulseStatusDisplay";
import { PulseCheckInButton } from "@/components/pulse/PulseCheckInButton";

export default function PulsePage() {
  const { authenticated, login } = usePrivy();
  const {
    statusInfo,
    lastSeen,
    threshold,
    handlePulse,
    isPending,
    isConfirming,
    isSuccess,
    isLoadingUserInfo,
    error,
    walletAddress,
  } = usePulse();

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 text-white mb-6">
              <Activity className="w-7 h-7" />
            </div>
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              Passage
            </Link>
            <h1 className="mt-6 text-2xl font-medium text-neutral-900">
              Quick check-in
            </h1>
            <p className="mt-2 text-neutral-500 text-sm">
              Sign in to confirm you&apos;re active. Takes about 5 seconds.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <button
              type="button"
              onClick={login}
              className="w-full bg-neutral-900 text-white py-4 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Sign in to check in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess && !isPending && !isConfirming) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            You&apos;re checked in
          </h1>
          <p className="text-neutral-500 text-sm mb-8">
            Your on-chain heartbeat was updated successfully.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Open full dashboard
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="px-6 py-5 text-center border-b border-neutral-200 bg-white">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-neutral-900"
        >
          Passage
        </Link>
        <p className="text-sm text-neutral-500 mt-1">Quick check-in</p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="w-full mb-8">
          <PulseStatusDisplay
            statusInfo={statusInfo}
            lastSeen={lastSeen}
            threshold={threshold}
            variant="compact"
          />
        </div>

        <div className="w-full bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 mb-4">
              <Activity className="w-6 h-6 text-neutral-700" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Confirm you&apos;re active
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Tap below to send your heartbeat on-chain.
            </p>
          </div>

          {!walletAddress && !isLoadingUserInfo && (
            <p className="text-sm text-amber-600 text-center mb-4">
              Wallet not connected. Complete onboarding first.
            </p>
          )}

          <PulseCheckInButton
            onClick={handlePulse}
            disabled={!walletAddress}
            isPending={isPending}
            isConfirming={isConfirming}
            size="large"
          />

          {error && (
            <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
          )}
        </div>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Open full dashboard
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </main>
    </div>
  );
}
