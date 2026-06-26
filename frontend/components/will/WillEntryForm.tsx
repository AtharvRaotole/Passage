"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { WillEntryFormData } from "@/types/will";

interface WillEntryFormProps {
  onSubmit: (entry: WillEntryFormData) => Promise<void>;
  isSaving: boolean;
}

const emptyForm: WillEntryFormData = {
  websiteUrl: "",
  username: "",
  password: "",
  instruction: "",
  totpSecret: "",
};

export function WillEntryForm({ onSubmit, isSaving }: WillEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WillEntryFormData>(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.websiteUrl.trim() || !form.instruction.trim()) {
      alert("Website URL and instruction are required");
      return;
    }
    await onSubmit(form);
    setForm(emptyForm);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add account credential
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4"
    >
      <h3 className="font-medium text-neutral-900">New credential</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Website URL</label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 mb-1">
            TOTP secret (optional)
          </label>
          <input
            type="password"
            value={form.totpSecret || ""}
            onChange={(e) => setForm({ ...form, totpSecret: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            autoComplete="off"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-neutral-600 mb-1">
          Execution instruction
        </label>
        <textarea
          value={form.instruction}
          onChange={(e) => setForm({ ...form, instruction: e.target.value })}
          placeholder="e.g. Log in and download account statements"
          rows={3}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none"
          required
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setForm(emptyForm);
          }}
          className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Encrypt &amp; save
        </button>
      </div>
    </form>
  );
}
