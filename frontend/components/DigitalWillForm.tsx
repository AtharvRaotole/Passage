"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { encryptCredential } from "@/utils/litCharon";
import { useStatusCenterContext } from "@/components/StatusCenterProvider";

interface WillEntry {
  websiteUrl: string;
  username: string;
  password: string;
  instruction: string;
}

export function DigitalWillForm() {
  const { address } = useAccount();
  const { addStatus, updateStatus, dismissStatus } = useStatusCenterContext();
  const [formData, setFormData] = useState<WillEntry>({
    websiteUrl: "",
    username: "",
    password: "",
    instruction: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [optimisticWills, setOptimisticWills] = useState<WillEntry[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setSubmitStatus({
        type: "error",
        message: "Please connect your wallet",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    // OPTIMISTIC UPDATE: Add to list immediately
    const optimisticEntry = { ...formData };
    setOptimisticWills((prev) => [...prev, optimisticEntry]);

    // Show status notification
    const statusId = addStatus({
      type: "sync",
      title: "Saving Digital Will",
      description: "Encrypting and syncing to secure vault...",
      status: "syncing",
    });

    try {
      // Encrypt the password using Lit Protocol
      console.log("Encrypting credential...");
      const { ciphertext, dataToEncryptHash } = await encryptCredential(
        formData.password,
        address
      );

      // Prepare data for database (mock save for now)
      const willData = {
        userAddress: address,
        websiteUrl: formData.websiteUrl,
        username: formData.username,
        encryptedPassword: ciphertext,
        passwordHash: dataToEncryptHash,
        instruction: formData.instruction,
        createdAt: new Date().toISOString(),
      };

      // Mock database save - replace with actual Supabase/Postgres call
      console.log("Saving to database (mock):", {
        ...willData,
        encryptedPassword: `${ciphertext.substring(0, 50)}...`,
      });

      // In production, this would be:
      // await supabase.from('digital_wills').insert(willData);

      // Simulate async save (in production, this would be the actual API call)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update status to completed
      updateStatus(statusId, {
        status: "completed",
        description: "Saved to secure vault",
      });

      setSubmitStatus({
        type: "success",
        message: "Digital will entry encrypted and saved successfully",
      });

      // Reset form
      setFormData({
        websiteUrl: "",
        username: "",
        password: "",
        instruction: "",
      });

      // Auto-dismiss status after 3 seconds
      setTimeout(() => dismissStatus(statusId), 3000);
    } catch (error: any) {
      console.error("Error saving digital will:", error);
      
      // Remove optimistic entry on error
      setOptimisticWills((prev) =>
        prev.filter((w) => w.websiteUrl !== optimisticEntry.websiteUrl)
      );

      // Update status to failed
      updateStatus(statusId, {
        status: "failed",
        description: error.message || "Failed to save",
      });

      setSubmitStatus({
        type: "error",
        message: error.message || "Failed to save digital will",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="websiteUrl" className="text-[#00ff00] font-mono">
          WEBSITE URL
        </Label>
        <Input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) =>
            setFormData({ ...formData, websiteUrl: e.target.value })
          }
          required
          className="bg-[#0a0a0a] border-[#00ff00]/30 text-gray-200 font-mono focus:border-[#00ff00]"
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" className="text-[#00ff00] font-mono">
          USERNAME
        </Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
          className="bg-[#0a0a0a] border-[#00ff00]/30 text-gray-200 font-mono focus:border-[#00ff00]"
          placeholder="your_username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#00ff00] font-mono">
          PASSWORD
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          className="bg-[#0a0a0a] border-[#00ff00]/30 text-gray-200 font-mono focus:border-[#00ff00]"
          placeholder="••••••••"
        />
        <p className="text-xs text-gray-500 font-mono">
          Password will be encrypted using Lit Protocol
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instruction" className="text-[#00ff00] font-mono">
          INSTRUCTION
        </Label>
        <Textarea
          id="instruction"
          value={formData.instruction}
          onChange={(e) =>
            setFormData({ ...formData, instruction: e.target.value })
          }
          required
          className="bg-[#0a0a0a] border-[#00ff00]/30 text-gray-200 font-mono focus:border-[#00ff00] min-h-[100px]"
          placeholder="e.g., Delete account, Transfer ownership, Close subscription..."
        />
      </div>

      {submitStatus.type && (
        <div
          className={`p-4 rounded border font-mono text-sm ${
            submitStatus.type === "success"
              ? "bg-green-900/20 border-green-500/50 text-green-400"
              : "bg-red-900/20 border-red-500/50 text-red-400"
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold"
      >
        {isSubmitting ? "ENCRYPTING..." : "REGISTER DIGITAL WILL"}
      </Button>
    </form>
  );
}

