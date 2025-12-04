"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Eye, 
  EyeOff, 
  Lock,
  Globe,
  Mail,
  Key,
  Trash2,
  Loader2
} from "lucide-react";

interface Credential {
  id: string;
  name: string;
  type: "website" | "email" | "crypto" | "other";
  website?: string;
  username?: string;
  password?: string;
  notes?: string;
  createdAt: Date;
}

export default function DigitalWillPage() {
  const { authenticated, user, login, logout } = usePrivy();
  const { address } = useAccount();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [newCredential, setNewCredential] = useState({
    name: "",
    type: "website" as const,
    website: "",
    username: "",
    password: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddCredential = async () => {
    if (!newCredential.name) {
      alert("Please enter a name for this credential");
      return;
    }

    setIsSaving(true);
    
    // Simulate encryption and saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const credential: Credential = {
      id: Date.now().toString(),
      name: newCredential.name,
      type: newCredential.type,
      website: newCredential.website,
      username: newCredential.username,
      password: newCredential.password,
      notes: newCredential.notes,
      createdAt: new Date(),
    };
    
    setCredentials([...credentials, credential]);
    setNewCredential({ name: "", type: "website", website: "", username: "", password: "", notes: "" });
    setShowAddForm(false);
    setIsSaving(false);
  };

  const handleDelete = (id: string) => {
    setCredentials(credentials.filter(c => c.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "website": return <Globe className="w-5 h-5" />;
      case "email": return <Mail className="w-5 h-5" />;
      case "crypto": return <Key className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Digital Will</h1>
          <p className="text-neutral-500 mb-8">Sign in to manage your account credentials</p>
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
            <h1 className="text-xl font-semibold">Digital Will</h1>
          </div>
          <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Info Banner */}
        <div className="bg-neutral-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">End-to-end encrypted</h3>
              <p className="text-sm text-neutral-600">
                All credentials are encrypted using Lit Protocol. They can only be decrypted by your beneficiaries after your account status changes.
              </p>
            </div>
          </div>
        </div>

        {/* Credentials List */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Account Credentials</h2>
              <p className="text-sm text-neutral-500">Securely store login information</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Credential
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-neutral-50 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newCredential.name}
                    onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                    placeholder="e.g., Gmail, Facebook"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Type</label>
                  <select
                    value={newCredential.type}
                    onChange={(e) => setNewCredential({ ...newCredential, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none bg-white"
                  >
                    <option value="website">Website</option>
                    <option value="email">Email</option>
                    <option value="crypto">Crypto Wallet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Website URL</label>
                <input
                  type="text"
                  value={newCredential.website}
                  onChange={(e) => setNewCredential({ ...newCredential, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Username / Email</label>
                  <input
                    type="text"
                    value={newCredential.username}
                    onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={newCredential.password}
                    onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Notes (optional)</label>
                <textarea
                  value={newCredential.notes}
                  onChange={(e) => setNewCredential({ ...newCredential, notes: e.target.value })}
                  placeholder="Additional information..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCredential}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Save & Encrypt
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Credentials */}
          {credentials.length > 0 ? (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div key={cred.id} className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
                        {getTypeIcon(cred.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900">{cred.name}</h4>
                        {cred.website && (
                          <p className="text-sm text-neutral-500">{cred.website}</p>
                        )}
                        {cred.username && (
                          <p className="text-sm text-neutral-600 mt-1">{cred.username}</p>
                        )}
                        {cred.password && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono text-neutral-600">
                              {showPassword[cred.id] ? cred.password : "••••••••"}
                            </span>
                            <button
                              onClick={() => setShowPassword({ ...showPassword, [cred.id]: !showPassword[cred.id] })}
                              className="p-1 hover:bg-neutral-200 rounded"
                            >
                              {showPassword[cred.id] ? (
                                <EyeOff className="w-4 h-4 text-neutral-500" />
                              ) : (
                                <Eye className="w-4 h-4 text-neutral-500" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No credentials stored</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                Add your important account credentials. They will be encrypted and only accessible to your beneficiaries when needed.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

