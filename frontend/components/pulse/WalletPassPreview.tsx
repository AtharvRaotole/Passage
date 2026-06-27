"use client";

import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

interface WalletPassPreviewProps {
  displayName?: string | null;
  lastSeen?: number | null;
  className?: string;
}

export function WalletPassPreview({
  displayName,
  lastSeen,
  className,
}: WalletPassPreviewProps) {
  const name = displayName || "Passage Member";
  const lastCheckInLabel = lastSeen
    ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true })
    : "No check-in yet";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-neutral-900 text-white p-6 min-h-[200px] flex flex-col justify-between shadow-lg ${className ?? ""}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-medium tracking-wide text-white/80">
            Passage
          </span>
        </div>
        <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
          Check-in Pass
        </p>
        <h3 className="text-xl font-semibold truncate">{name}</h3>
      </div>

      <div className="relative mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <div>
            <p className="text-xs text-white/50">Last check-in</p>
            <p className="text-sm font-medium">{lastCheckInLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
