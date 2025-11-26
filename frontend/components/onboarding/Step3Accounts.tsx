"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingData } from "./OnboardingWizard";

interface Step3AccountsProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_SERVICES = [
  { name: "Netflix", icon: "🎬", defaultInstruction: "Cancel subscription" },
  { name: "Facebook", icon: "📘", defaultInstruction: "Memorialize account" },
  { name: "Twitter", icon: "🐦", defaultInstruction: "Deactivate account" },
  { name: "Instagram", icon: "📷", defaultInstruction: "Memorialize account" },
  { name: "GitHub", icon: "💻", defaultInstruction: "Transfer repository ownership" },
  { name: "AWS", icon: "☁️", defaultInstruction: "Cancel all services" },
  { name: "Google", icon: "🔍", defaultInstruction: "Transfer account access" },
  { name: "Bank", icon: "🏦", defaultInstruction: "Transfer funds to beneficiary" },
];

export function Step3Accounts({ data, setData, onNext, onBack }: Step3AccountsProps) {
  const [newAccount, setNewAccount] = useState({
    service: "",
    username: "",
    password: "",
    type: "manual" as "oauth" | "manual",
  });

  const handleAddAccount = () => {
    if (!newAccount.service || !newAccount.username) return;

    const account = {
      ...newAccount,
      imported: false,
    };

    setData({
      ...data,
      accounts: [...data.accounts, account],
    });

    // Find matching instruction or create default
    const service = COMMON_SERVICES.find((s) => s.name === newAccount.service);
    if (service && !data.instructions.find((i) => i.service === newAccount.service)) {
      setData({
        ...data,
        instructions: [
          ...data.instructions,
          {
            service: newAccount.service,
            instruction: service.defaultInstruction,
          },
        ],
      });
    }

    setNewAccount({ service: "", username: "", password: "", type: "manual" });
  };

  const handleOAuthImport = async (service: string) => {
    // Mock OAuth flow - in production, integrate with actual OAuth providers
    alert(`OAuth import for ${service} would open here. For now, this is a demo.`);
    
    // Simulate successful import
    const account = {
      service,
      username: `${service.toLowerCase()}.com`,
      type: "oauth" as const,
      imported: true,
    };

    setData({
      ...data,
      accounts: [...data.accounts, account],
    });

    // Add default instruction
    const serviceData = COMMON_SERVICES.find((s) => s.name === service);
    if (serviceData && !data.instructions.find((i) => i.service === service)) {
      setData({
        ...data,
        instructions: [
          ...data.instructions,
          {
            service,
            instruction: serviceData.defaultInstruction,
          },
        ],
      });
    }
  };

  const handleRemoveAccount = (index: number) => {
    const account = data.accounts[index];
    setData({
      ...data,
      accounts: data.accounts.filter((_, i) => i !== index),
      instructions: data.instructions.filter((i) => i.service !== account.service),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Step 3: Import Your Accounts
        </h2>
        <p className="text-gray-400">
          Add the accounts you want to protect. We'll use OAuth where possible, or you can add them manually.
        </p>
      </div>

      {/* Quick Add Common Services */}
      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Quick Add</CardTitle>
          <CardDescription className="text-gray-400">
            Click to add common services (OAuth where available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {COMMON_SERVICES.map((service) => (
              <Button
                key={service.name}
                variant="outline"
                onClick={() => handleOAuthImport(service.name)}
                disabled={data.accounts.some((a) => a.service === service.name)}
                className="h-auto py-3 border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono"
              >
                <div>
                  <div className="text-2xl mb-1">{service.icon}</div>
                  <div className="text-xs">{service.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Add */}
      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Add Account Manually</CardTitle>
          <CardDescription className="text-gray-400">
            For services that don't support OAuth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#00ff00] font-mono">Service Name</Label>
              <Input
                value={newAccount.service}
                onChange={(e) => setNewAccount({ ...newAccount, service: e.target.value })}
                placeholder="e.g., Netflix"
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#00ff00] font-mono">Username/Email</Label>
              <Input
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                placeholder="your@email.com"
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">Password (optional - will be encrypted)</Label>
            <Input
              type="password"
              value={newAccount.password}
              onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
              placeholder="••••••••"
              className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
            />
          </div>
          <Button
            onClick={handleAddAccount}
            disabled={!newAccount.service || !newAccount.username}
            className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
          >
            Add Account
          </Button>
        </CardContent>
      </Card>

      {/* Added Accounts */}
      {data.accounts.length > 0 && (
        <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              Your Accounts ({data.accounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.accounts.map((account, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#00ff00]/10"
                >
                  <div>
                    <p className="font-mono text-[#00ff00]">{account.service}</p>
                    <p className="text-xs text-gray-400 font-mono">{account.username}</p>
                    {account.type === "oauth" && (
                      <span className="text-xs text-green-400 font-mono">✓ OAuth Connected</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccount(index)}
                    className="text-red-400 hover:text-red-300 font-mono"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.accounts.length === 0 && (
        <div className="p-4 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
          <p className="text-sm font-mono text-[#00ff00]">
            💡 Tip: Start with your most important accounts. You can always add more later.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={data.accounts.length === 0}
          className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold px-8"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

