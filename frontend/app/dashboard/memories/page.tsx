"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import { MemoryVault } from "@/components/memories/MemoryVault";
import { TimeCapsule } from "@/components/memories/TimeCapsule";

export default function MemoriesPage() {
  const { authenticated, login, logout } = usePrivy();
  const [activeTab, setActiveTab] = useState<"vault" | "capsules">("vault");

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-8 h-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Memory Vault</h1>
          <p className="text-neutral-500 mb-8">Sign in to preserve your memories</p>
          <button
            onClick={login}
            className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <h1 className="text-xl font-semibold">Memory Vault</h1>
          </div>
          <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("vault")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "vault"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Photos & Messages
            </button>
            <button
              onClick={() => setActiveTab("capsules")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "capsules"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Time Capsules
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-neutral-500 mb-6">
          Add memories below (title + file), then <strong>Encrypt &amp; Upload</strong> sends them to your backend IPFS
          endpoint. Time capsules encrypt a message locally via Lit — wallet signature required.
        </p>
        {activeTab === "vault" ? (
          <MemoryVault />
        ) : (
          <div className="space-y-6">
            <TimeCapsule />
            <div className="bg-neutral-100 rounded-2xl p-6">
              <h3 className="font-medium text-neutral-900 mb-4">How Time Capsules Work</h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-neutral-600">
                <p>
                  <strong className="text-neutral-900">1. Create</strong> — Add your message and unlock rule.
                </p>
                <p>
                  <strong className="text-neutral-900">2. Schedule</strong> — Date, recipient, or estate trigger.
                </p>
                <p>
                  <strong className="text-neutral-900">3. Deliver</strong> — Unlocks when conditions are met.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
