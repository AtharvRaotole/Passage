"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MemoryVault } from "@/components/memories/MemoryVault";
import { TimeCapsule } from "@/components/memories/TimeCapsule";

export default function MemoriesPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"vault" | "capsules">("vault");

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">MEMORY VAULT ACCESS</CardTitle>
            <CardDescription className="text-gray-400">Connect your wallet to access your memories</CardDescription>
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#00ff00]/20 pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-[#00ff00]">MEMORY VAULT</h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              Preserve your memories. Share your legacy. Forever encrypted and stored on IPFS.
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#00ff00]/20">
          <Button
            variant={activeTab === "vault" ? "default" : "ghost"}
            onClick={() => setActiveTab("vault")}
            className={`font-mono ${
              activeTab === "vault"
                ? "bg-[#00ff00] text-black"
                : "text-gray-400 hover:text-[#00ff00]"
            }`}
          >
            Memory Vault
          </Button>
          <Button
            variant={activeTab === "capsules" ? "default" : "ghost"}
            onClick={() => setActiveTab("capsules")}
            className={`font-mono ${
              activeTab === "capsules"
                ? "bg-[#00ff00] text-black"
                : "text-gray-400 hover:text-[#00ff00]"
            }`}
          >
            Time Capsules
          </Button>
        </div>

        {/* Content */}
        {activeTab === "vault" && <MemoryVault />}
        {activeTab === "capsules" && <TimeCapsule />}
      </div>
    </div>
  );
}

