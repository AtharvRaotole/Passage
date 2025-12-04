"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrustSafety } from "@/components/privacy/TrustSafety";
import { LoginButton } from "@/components/LoginComponent";

export default function PrivacyPage() {
  const { authenticated, user } = usePrivy();
  const { address } = useAccount();
  const walletAddress = address || user?.wallet?.address;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#00ff00]/20 pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-[#00ff00]">TRUST & SAFETY</h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              Cryptographic proofs, security audits, and transparency reports
            </p>
          </div>
          <LoginButton />
        </div>

        <TrustSafety userAddress={walletAddress} />
      </div>
    </div>
  );
}

