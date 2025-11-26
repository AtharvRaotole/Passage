"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingData } from "./OnboardingWizard";
import { encryptCredential } from "@/utils/litCharon";
import { useAccount } from "wagmi";

interface Step5ReviewProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  isPending: boolean;
  isSuccess: boolean;
}

export function Step5Review({ data, onComplete, onBack, isPending, isSuccess }: Step5ReviewProps) {
  const { address } = useAccount();
  const [encrypting, setEncrypting] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);

  const handleEncryptAndComplete = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    setEncrypting(true);
    setEncryptionProgress(0);

    try {
      // Encrypt passwords for accounts that have them
      const accountsWithPasswords = data.accounts.filter((a) => a.password);
      
      for (let i = 0; i < accountsWithPasswords.length; i++) {
        const account = accountsWithPasswords[i];
        try {
          await encryptCredential(account.password || "", address);
          setEncryptionProgress(((i + 1) / accountsWithPasswords.length) * 100);
        } catch (error) {
          console.error(`Failed to encrypt password for ${account.service}:`, error);
        }
      }

      setEncryptionProgress(100);
      setEncrypting(false);
      
      // Complete registration
      onComplete();
    } catch (error) {
      console.error("Encryption failed:", error);
      setEncrypting(false);
      alert("Encryption failed. Please try again.");
    }
  };

  const formatDays = (seconds: number) => {
    return Math.floor(seconds / (24 * 60 * 60));
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Your Digital Safety Net is Ready!
        </h2>
        <p className="text-gray-400 text-lg">
          Everything is set up and encrypted. Redirecting to your dashboard...
        </p>
        <div className="mt-8 p-6 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#00ff00] font-mono">
                {data.guardians.length}
              </div>
              <div className="text-sm text-gray-400 font-mono">Guardians</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00ff00] font-mono">
                {data.accounts.length}
              </div>
              <div className="text-sm text-gray-400 font-mono">Accounts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#00ff00] font-mono">
                {data.instructions.length}
              </div>
              <div className="text-sm text-gray-400 font-mono">Instructions</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Step 5: Review & Encrypt
        </h2>
        <p className="text-gray-400">
          Review your settings and complete the setup. Everything will be encrypted and secured.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">Heartbeat Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#00ff00] font-mono">
              Every {formatDays(data.heartbeatIntervalSeconds)} days
            </p>
            <p className="text-sm text-gray-400 font-mono mt-2">
              We'll check in with you regularly
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">Guardians</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#00ff00] font-mono">
              {data.guardians.length} Guardians
            </p>
            <p className="text-sm text-gray-400 font-mono mt-2">
              {data.requiredConfirmations} of {data.guardians.length} required
            </p>
            <div className="mt-2 space-y-1">
              {data.guardians.map((guardian, i) => (
                <p key={i} className="text-xs font-mono text-gray-500">
                  {guardian.slice(0, 10)}...{guardian.slice(-6)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">
            Accounts & Instructions ({data.accounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.accounts.map((account, index) => {
              const instruction = data.instructions.find((i) => i.service === account.service);
              return (
                <div
                  key={index}
                  className="p-3 bg-[#1a1a1a] rounded border border-[#00ff00]/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-[#00ff00] font-bold">{account.service}</p>
                      <p className="text-xs text-gray-400 font-mono">{account.username}</p>
                      {instruction && (
                        <p className="text-xs text-gray-300 font-mono mt-1">
                          → {instruction.instruction}
                        </p>
                      )}
                    </div>
                    {account.type === "oauth" && (
                      <span className="text-xs text-green-400 font-mono">✓ OAuth</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Encryption Progress */}
      {encrypting && (
        <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-mono text-[#00ff00]">Encrypting passwords...</span>
                <span className="text-sm font-mono text-[#00ff00]">{Math.round(encryptionProgress)}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                <div
                  className="bg-[#00ff00] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${encryptionProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
        <p className="text-sm font-mono text-[#00ff00]">
          🔒 All your data will be encrypted using Lit Protocol. Only you (or your guardians if needed) 
          can decrypt it. Your passwords and instructions are secure.
        </p>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={encrypting || isPending}
          className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono"
        >
          ← Back
        </Button>
        <Button
          onClick={handleEncryptAndComplete}
          disabled={encrypting || isPending}
          className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold px-8"
        >
          {encrypting
            ? "Encrypting..."
            : isPending
            ? "Registering..."
            : "Complete Setup & Encrypt"}
        </Button>
      </div>
    </div>
  );
}

