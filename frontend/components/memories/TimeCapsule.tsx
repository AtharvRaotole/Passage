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

const selectClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400";

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
      alert(!address ? "Connect your wallet first." : "Please enter a message.");
      return;
    }

    if (newCapsule.unlockType === "date" && !newCapsule.unlockDate) {
      alert("Please select an unlock date.");
      return;
    }

    if (newCapsule.unlockType === "person" && !newCapsule.unlockPerson) {
      alert("Please enter a recipient address.");
      return;
    }

    try {
      const messageBlob = new Blob([newCapsule.message], { type: "text/plain" });
      const messageFile = new File([messageBlob], "time-capsule.txt", { type: "text/plain" });

      await encryptMemory(messageFile, address);

      const capsule: TimeCapsule = {
        id: `capsule_${Date.now()}`,
        message: newCapsule.message,
        unlockType: newCapsule.unlockType as TimeCapsule["unlockType"],
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

      alert("Time capsule created. Your message was encrypted for the chosen conditions.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create time capsule.";
      alert(`Error: ${message}`);
    }
  }, [address, newCapsule]);

  return (
    <div className="space-y-6">
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Create time capsule</CardTitle>
          <CardDescription className="text-neutral-500">
            Unlock on a date, for a specific person, or when your estate status updates on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-neutral-700">Unlock condition</Label>
            <select
              value={newCapsule.unlockType}
              onChange={(e) =>
                setNewCapsule({ ...newCapsule, unlockType: e.target.value as TimeCapsule["unlockType"] })
              }
              className={selectClass}
            >
              <option value="date">Unlock on date</option>
              <option value="person">Unlock for a specific person</option>
              <option value="death">Unlock on my passing</option>
            </select>
          </div>

          {newCapsule.unlockType === "date" && (
            <div className="space-y-2">
              <Label className="text-neutral-700">Unlock date</Label>
              <Input
                type="date"
                value={newCapsule.unlockDate}
                onChange={(e) => setNewCapsule({ ...newCapsule, unlockDate: e.target.value })}
                className="border-neutral-200 bg-white"
              />
            </div>
          )}

          {newCapsule.unlockType === "person" && (
            <div className="space-y-2">
              <Label className="text-neutral-700">Recipient wallet address</Label>
              <Input
                value={newCapsule.unlockPerson}
                onChange={(e) => setNewCapsule({ ...newCapsule, unlockPerson: e.target.value })}
                placeholder="0x…"
                className="border-neutral-200 bg-white font-mono text-sm placeholder:text-neutral-400"
              />
            </div>
          )}

          {newCapsule.unlockType === "death" && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-700">
                This message is intended to unlock when your status matches your CharonSwitch rules (e.g.
                deceased), per your contract setup.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-neutral-700">Your message *</Label>
            <Textarea
              value={newCapsule.message}
              onChange={(e) => setNewCapsule({ ...newCapsule, message: e.target.value })}
              placeholder="Write your message to the future…"
              className="min-h-[200px] border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400"
            />
          </div>

          <Button
            onClick={handleCreateCapsule}
            disabled={!newCapsule.message}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Create time capsule
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Your time capsules ({capsules.length})
        </h2>
        {capsules.length === 0 ? (
          <Card className="border border-neutral-200 bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-neutral-500">No time capsules yet. Create one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {capsules.map((capsule) => (
              <Card key={capsule.id} className="border border-neutral-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="mb-1 font-semibold text-neutral-900">
                        {capsule.unlockType === "date" && `Unlocks: ${capsule.unlockDate}`}
                        {capsule.unlockType === "person" &&
                          `For: ${capsule.unlockPerson?.slice(0, 10)}…`}
                        {capsule.unlockType === "death" && "Unlocks on passing"}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Created {new Date(capsule.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-emerald-600">Encrypted</span>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-neutral-700">
                      {capsule.message.length > 200
                        ? `${capsule.message.slice(0, 200)}…`
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
