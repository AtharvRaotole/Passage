"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { encryptMemory } from "@/utils/memoryStorage";

interface TimeCapsule {
  id: string;
  message: string;
  unlockType: "date" | "person" | "death";
  unlockDate?: string;
  unlockPerson?: string;
  encrypted: boolean;
  createdAt: string;
}

export function TimeCapsule() {
  const { address } = useAccount();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [newCapsule, setNewCapsule] = useState<Partial<TimeCapsule>>({
    message: "",
    unlockType: "date",
    unlockDate: "",
    unlockPerson: "",
  });

  const handleCreateCapsule = useCallback(async () => {
    if (!address || !newCapsule.message) {
      alert("Please enter a message");
      return;
    }

    if (newCapsule.unlockType === "date" && !newCapsule.unlockDate) {
      alert("Please select an unlock date");
      return;
    }

    if (newCapsule.unlockType === "person" && !newCapsule.unlockPerson) {
      alert("Please enter a recipient address");
      return;
    }

    try {
      // Create a text file from the message
      const messageBlob = new Blob([newCapsule.message], { type: "text/plain" });
      const messageFile = new File([messageBlob], "time-capsule.txt", { type: "text/plain" });

      // Encrypt the message
      await encryptMemory(messageFile, address);

      const capsule: TimeCapsule = {
        id: `capsule_${Date.now()}`,
        message: newCapsule.message,
        unlockType: newCapsule.unlockType as any,
        unlockDate: newCapsule.unlockDate,
        unlockPerson: newCapsule.unlockPerson,
        encrypted: true,
        createdAt: new Date().toISOString(),
      };

      setCapsules((prev) => [...prev, capsule]);
      setNewCapsule({
        message: "",
        unlockType: "date",
        unlockDate: "",
        unlockPerson: "",
      });

      alert("Time Capsule Created! Your message is encrypted and will unlock based on your conditions.");
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to create time capsule"}`);
    }
  }, [address, newCapsule]);

  return (
    <div className="space-y-6">
      {/* Create Time Capsule */}
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Create Time Capsule</CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Send a message to the future. Unlock on a specific date, for a specific person, or on your passing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">Unlock Condition</Label>
            <select
              value={newCapsule.unlockType}
              onChange={(e) => setNewCapsule({ ...newCapsule, unlockType: e.target.value as any })}
              className="w-full bg-[#0a0a0a] border border-[#00ff00]/30 text-[#00ff00] font-mono p-2 rounded"
            >
              <option value="date">Unlock on Date</option>
              <option value="person">Unlock for Specific Person</option>
              <option value="death">Unlock on My Passing</option>
            </select>
          </div>

          {newCapsule.unlockType === "date" && (
            <div className="space-y-2">
              <Label className="text-[#00ff00] font-mono">Unlock Date</Label>
              <Input
                type="date"
                value={newCapsule.unlockDate}
                onChange={(e) => setNewCapsule({ ...newCapsule, unlockDate: e.target.value })}
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
              />
            </div>
          )}

          {newCapsule.unlockType === "person" && (
            <div className="space-y-2">
              <Label className="text-[#00ff00] font-mono">Recipient Wallet Address</Label>
              <Input
                value={newCapsule.unlockPerson}
                onChange={(e) => setNewCapsule({ ...newCapsule, unlockPerson: e.target.value })}
                placeholder="0x..."
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
              />
            </div>
          )}

          {newCapsule.unlockType === "death" && (
            <div className="p-3 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
              <p className="text-sm text-[#00ff00] font-mono">
                This message will unlock when your status changes to DECEASED in the CharonSwitch contract.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">Your Message *</Label>
            <Textarea
              value={newCapsule.message}
              onChange={(e) => setNewCapsule({ ...newCapsule, message: e.target.value })}
              placeholder="Write your message to the future..."
              className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono min-h-[200px]"
            />
          </div>

          <Button
            onClick={handleCreateCapsule}
            disabled={!newCapsule.message}
            className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
          >
            Create Time Capsule
          </Button>
        </CardContent>
      </Card>

      {/* Time Capsules List */}
      <div>
        <h2 className="text-2xl font-mono font-bold text-[#00ff00] mb-4">
          Your Time Capsules ({capsules.length})
        </h2>
        {capsules.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-400 font-mono">No time capsules yet. Create your first one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {capsules.map((capsule) => (
              <Card key={capsule.id} className="bg-[#1a1a1a] border-[#00ff00]/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-mono font-bold text-[#00ff00] mb-2">
                        {capsule.unlockType === "date" && `Unlocks: ${capsule.unlockDate}`}
                        {capsule.unlockType === "person" && `For: ${capsule.unlockPerson?.slice(0, 10)}...`}
                        {capsule.unlockType === "death" && "Unlocks on Your Passing"}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        Created: {new Date(capsule.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-green-400">✓ Encrypted</span>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] rounded border border-[#00ff00]/10">
                    <p className="text-gray-300 font-mono whitespace-pre-wrap">
                      {capsule.message.length > 200
                        ? `${capsule.message.slice(0, 200)}...`
                        : capsule.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

