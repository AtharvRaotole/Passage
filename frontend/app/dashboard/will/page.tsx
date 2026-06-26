"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { WillVault } from "@/components/will/WillVault";

export default function DigitalWillPage() {
  const { authenticated, login, logout } = usePrivy();

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Digital Will</h1>
          <p className="text-neutral-500 mb-8">
            Sign in to manage encrypted account credentials
          </p>
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
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <h1 className="text-xl font-semibold">Digital Will</h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-sm text-neutral-500 mb-6">
          Store login credentials and instructions for automated execution when your
          estate is verified. Passwords are encrypted in your browser — we never
          receive plaintext.
        </p>
        <WillVault />
      </main>
    </div>
  );
}
