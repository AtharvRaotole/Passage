"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import Link from "next/link";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Clock, 
  Upload, 
  Plus,
  Calendar,
  Lock
} from "lucide-react";

export default function MemoriesPage() {
  const { authenticated, user, login, logout } = usePrivy();
  const { address } = useAccount();
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
        {activeTab === "vault" ? (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center hover:border-neutral-300 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Upload memories</h3>
              <p className="text-neutral-500 mb-4">Drag and drop photos or click to browse</p>
              <button className="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
                Choose files
              </button>
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Personal Messages</h2>
                  <p className="text-sm text-neutral-500">Leave messages for your loved ones</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800">
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              </div>
              
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-neutral-500">No messages yet</p>
                <p className="text-sm text-neutral-400">Create your first personal message</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Create Capsule */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Time Capsules</h2>
                  <p className="text-sm text-neutral-500">Schedule messages and memories to unlock later</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800">
                  <Plus className="w-4 h-4" />
                  Create Capsule
                </button>
              </div>

              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No time capsules</h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  Create a time capsule with photos, videos, and messages that will be delivered to someone special at a future date.
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-neutral-100 rounded-2xl p-6">
              <h3 className="font-medium text-neutral-900 mb-4">How Time Capsules Work</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">Create</p>
                    <p className="text-sm text-neutral-500">Add your memories and messages</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">Schedule</p>
                    <p className="text-sm text-neutral-500">Set the unlock date and recipient</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">Deliver</p>
                    <p className="text-sm text-neutral-500">Capsule unlocks automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
