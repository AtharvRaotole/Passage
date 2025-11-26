"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingData } from "./OnboardingWizard";

interface Step4InstructionsProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const SMART_DEFAULTS: Record<string, string> = {
  Netflix: "Cancel subscription",
  Facebook: "Memorialize account",
  Twitter: "Deactivate account",
  Instagram: "Memorialize account",
  GitHub: "Transfer repository ownership to @tech-team",
  AWS: "Cancel all EC2 instances and delete unused resources",
  Google: "Transfer account access to beneficiary",
  Bank: "Transfer funds to beneficiary account",
  "Electric Company": "Close account",
  MetaMask: "Transfer all tokens to beneficiary wallet",
  Coinbase: "Close account and transfer funds",
  Wise: "Transfer all balances to beneficiary",
  Revolut: "Close account and transfer funds",
  Airbnb: "Cancel all upcoming bookings",
  Stripe: "Transfer business account to beneficiary",
};

export function Step4Instructions({ data, setData, onNext, onBack }: Step4InstructionsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState("");

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditInstruction(data.instructions[index].instruction);
  };

  const handleSave = (index: number) => {
    const newInstructions = [...data.instructions];
    newInstructions[index].instruction = editInstruction;
    setData({
      ...data,
      instructions: newInstructions,
    });
    setEditingIndex(null);
    setEditInstruction("");
  };

  const handleAddInstruction = (service: string) => {
    if (data.instructions.find((i) => i.service === service)) return;

    const defaultInstruction = SMART_DEFAULTS[service] || "Close account";
    setData({
      ...data,
      instructions: [
        ...data.instructions,
        {
          service,
          instruction: defaultInstruction,
        },
      ],
    });
  };

  // Ensure all accounts have instructions
  const missingInstructions = data.accounts.filter(
    (account) => !data.instructions.find((i) => i.service === account.service)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Step 4: Set Instructions
        </h2>
        <p className="text-gray-400">
          Tell us what to do with each account. We've provided smart defaults, but you can customize everything.
        </p>
      </div>

      {/* Missing Instructions Alert */}
      {missingInstructions.length > 0 && (
        <Card className="bg-yellow-900/20 border-yellow-500/50">
          <CardContent className="pt-6">
            <p className="text-yellow-400 font-mono">
              ⚠️ {missingInstructions.length} account(s) need instructions. Click "Add Instruction" below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions List */}
      <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">
            Your Instructions ({data.instructions.length})
          </CardTitle>
          <CardDescription className="text-gray-400">
            Review and edit instructions for each account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.instructions.map((instruction, index) => (
            <div
              key={index}
              className="p-4 bg-[#1a1a1a] rounded border border-[#00ff00]/10"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono text-[#00ff00] font-bold">{instruction.service}</p>
                  {editingIndex === index ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono min-h-[80px]"
                        placeholder="Enter instruction..."
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(index)}
                          className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono text-sm"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingIndex(null);
                            setEditInstruction("");
                          }}
                          className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 font-mono text-sm mt-1">{instruction.instruction}</p>
                  )}
                </div>
                {editingIndex !== index && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(index)}
                    className="text-[#00ff00] hover:text-[#00cc00] font-mono"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))}

          {data.instructions.length === 0 && (
            <p className="text-gray-500 font-mono text-center py-8">
              No instructions set yet. Add accounts in Step 3 to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Missing Instructions */}
      {missingInstructions.length > 0 && (
        <Card className="bg-[#0a0a0a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">Add Missing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missingInstructions.map((account) => (
                <div
                  key={account.service}
                  className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded"
                >
                  <span className="font-mono text-[#00ff00]">{account.service}</span>
                  <Button
                    onClick={() => handleAddInstruction(account.service)}
                    className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono text-sm"
                  >
                    Add Instruction
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
        <p className="text-sm font-mono text-[#00ff00]">
          💡 Tip: Be specific with your instructions. For example, "Transfer repository ownership to @username" 
          is better than "Handle GitHub account".
        </p>
      </div>

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
          disabled={data.instructions.length === 0}
          className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold px-8"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

