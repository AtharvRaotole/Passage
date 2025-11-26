"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingData } from "./OnboardingWizard";

interface Step1WalletProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
}

export function Step1Wallet({ data, setData, onNext }: Step1WalletProps) {
  const { isConnected, address } = useAccount();
  const [intervalDays, setIntervalDays] = useState(data.heartbeatInterval);

  const handleIntervalChange = (days: number) => {
    setIntervalDays(days);
    setData({
      ...data,
      heartbeatInterval: days,
      heartbeatIntervalSeconds: days * 24 * 60 * 60,
    });
  };

  const canProceed = isConnected && address && intervalDays > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Step 1: Connect Your Wallet
        </h2>
        <p className="text-gray-400">
          Connect your wallet to get started. This will be your primary account for the safety net.
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Wallet Connection</CardTitle>
          <CardDescription className="text-gray-400">
            Connect using MetaMask, WalletConnect, or any supported wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <ConnectButton />
          </div>
          {isConnected && address && (
            <div className="mt-4 p-3 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
              <p className="text-sm font-mono text-[#00ff00]">
                ✓ Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Heartbeat Schedule</CardTitle>
          <CardDescription className="text-gray-400">
            How often should we check in? If you don't respond, we'll notify your guardians.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[7, 14, 30, 90].map((days) => (
              <Button
                key={days}
                variant={intervalDays === days ? "default" : "outline"}
                onClick={() => handleIntervalChange(days)}
                className={`font-mono ${
                  intervalDays === days
                    ? "bg-[#00ff00] text-black"
                    : "border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10"
                }`}
              >
                {days} days
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">Or enter custom days</Label>
            <Input
              type="number"
              min="1"
              value={intervalDays}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 30)}
              className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
            />
          </div>
          <p className="text-xs text-gray-500 font-mono">
            We'll send you a reminder every {intervalDays} days. If you don't respond, your guardians will be notified.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold px-8"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

