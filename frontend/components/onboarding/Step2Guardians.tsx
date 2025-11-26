"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingData } from "./OnboardingWizard";

interface Step2GuardiansProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const GUARDIAN_TEMPLATES = {
  family: {
    name: "3 Family Members",
    description: "Perfect for close family protection",
    requiredConfirmations: 2,
  },
  lawyer: {
    name: "1 Lawyer + 2 Friends",
    description: "Professional oversight with trusted friends",
    requiredConfirmations: 2,
  },
  custom: {
    name: "Custom",
    description: "Choose your own guardians",
    requiredConfirmations: 2,
  },
};

export function Step2Guardians({ data, setData, onNext, onBack }: Step2GuardiansProps) {
  const [guardianAddresses, setGuardianAddresses] = useState<string[]>(
    data.guardians.length > 0 ? data.guardians : ["", "", ""]
  );
  const [selectedTemplate, setSelectedTemplate] = useState<"family" | "lawyer" | "custom">(
    data.guardianTemplate
  );

  const handleTemplateSelect = (template: "family" | "lawyer" | "custom") => {
    setSelectedTemplate(template);
    setData({
      ...data,
      guardianTemplate: template,
      requiredConfirmations: GUARDIAN_TEMPLATES[template].requiredConfirmations,
    });
  };

  const handleGuardianChange = (index: number, value: string) => {
    const newAddresses = [...guardianAddresses];
    newAddresses[index] = value;
    setGuardianAddresses(newAddresses);
    setData({
      ...data,
      guardians: newAddresses.filter((addr) => addr.length > 0),
    });
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const fillTestAddresses = () => {
    // Generate 3 random valid Ethereum addresses for testing
    const testAddresses = [
      "0x3a20111c22309e36316e54e138b217980fd7b8ce",
      "0x7803e858280d6791eca28b3ec7223b0d51943828",
      "0xd52b80eca1e5c13e1f0150c34b1d35c658e6de4d"
    ];
    setGuardianAddresses(testAddresses);
    setData({
      ...data,
      guardians: testAddresses,
    });
  };

  const canProceed =
    guardianAddresses.filter((addr) => isValidAddress(addr)).length === 3 &&
    guardianAddresses.every((addr, i, arr) => {
      if (!addr) return true;
      return arr.filter((a) => a === addr).length === 1;
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Step 2: Choose Your Guardians
        </h2>
        <p className="text-gray-400">
          Select 3 trusted people who will be notified if you don't respond. They'll help protect your digital legacy.
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Guardian Templates</CardTitle>
          <CardDescription className="text-gray-400">
            Choose a template or customize your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(GUARDIAN_TEMPLATES).map(([key, template]) => (
              <Button
                key={key}
                variant={selectedTemplate === key ? "default" : "outline"}
                onClick={() => handleTemplateSelect(key as any)}
                className={`h-auto py-4 font-mono ${
                  selectedTemplate === key
                    ? "bg-[#00ff00] text-black"
                    : "border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10"
                }`}
              >
                <div className="text-left">
                  <div className="font-bold">{template.name}</div>
                  <div className="text-xs opacity-80">{template.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Guardian Addresses</CardTitle>
          <CardDescription className="text-gray-400">
            Enter wallet addresses for your 3 guardians
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <Label className="text-[#00ff00] font-mono">
                Guardian {index + 1} {selectedTemplate === "family" && index === 0 && "(e.g., Spouse)"}
                {selectedTemplate === "lawyer" && index === 0 && "(Lawyer)"}
                {selectedTemplate === "lawyer" && index > 0 && `(Friend ${index})`}
              </Label>
              <Input
                value={guardianAddresses[index] || ""}
                onChange={(e) => handleGuardianChange(index, e.target.value)}
                placeholder="0x..."
                className={`bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono ${
                  guardianAddresses[index] && !isValidAddress(guardianAddresses[index])
                    ? "border-red-500"
                    : ""
                }`}
              />
              {guardianAddresses[index] && !isValidAddress(guardianAddresses[index]) && (
                <p className="text-xs text-red-400 font-mono">Invalid address format</p>
              )}
            </div>
          ))}
          <div className="mt-4 space-y-2">
            <Button
              type="button"
              onClick={fillTestAddresses}
              variant="outline"
              className="w-full border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono text-sm"
            >
              🎲 Fill with Test Addresses (for testing)
            </Button>
            <div className="p-3 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
              <p className="text-sm font-mono text-[#00ff00]">
                💡 Tip: Your guardians need to have a wallet address. They don't need to be technical - 
                you can help them set one up or use a service like Coinbase Wallet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          disabled={!canProceed}
          className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold px-8"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

