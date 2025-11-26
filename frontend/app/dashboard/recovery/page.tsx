"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecoveryDashboard } from "@/components/RecoveryDashboard";

export default function RecoveryPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              RECOVERY DASHBOARD ACCESS
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your wallet to access the recovery dashboard
            </CardDescription>
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#00ff00]/20 pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-[#00ff00]">
              RECOVERY DASHBOARD
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              PROACTIVE UNCLAIMED PROPERTY RECOVERY - $140B VALUE PROPOSITION
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Recovery Dashboard Component */}
        <RecoveryDashboard />
      </div>
    </div>
  );
}

