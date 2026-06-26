"use client";

import { Globe, Trash2 } from "lucide-react";
import { WillEntry } from "@/types/will";

interface WillEntryCardProps {
  entry: WillEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function WillEntryCard({ entry, onDelete, isDeleting }: WillEntryCardProps) {
  const created = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString()
    : "";

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 flex items-start justify-between gap-4">
      <div className="flex gap-4 min-w-0">
        <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-neutral-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-neutral-900 truncate">
            {entry.website_url}
          </h3>
          {entry.username && (
            <p className="text-sm text-neutral-500 truncate">{entry.username}</p>
          )}
          <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
            {entry.instruction}
          </p>
          {created && (
            <p className="text-xs text-neutral-400 mt-2">Added {created}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        disabled={isDeleting || entry.id.startsWith("optimistic_")}
        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        aria-label="Delete entry"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
