"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { thresholdToDays } from "@/lib/pulseUtils";
import type { PulseStatusInfo } from "@/lib/pulseUtils";

interface PulseStatusDisplayProps {
  statusInfo: PulseStatusInfo;
  lastSeen: number | null;
  threshold: number | null;
  variant?: "default" | "compact";
}

export function PulseStatusDisplay({
  statusInfo,
  lastSeen,
  threshold,
  variant = "default",
}: PulseStatusDisplayProps) {
  const StatusIcon = statusInfo.icon;
  const thresholdDays = thresholdToDays(threshold);

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusInfo.bg}`}
        >
          <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
          <span className={`font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
        {lastSeen && (
          <span className="text-neutral-500">
            Last check-in{" "}
            <span className="text-neutral-900 font-medium">
              {formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}
            </span>
          </span>
        )}
        {thresholdDays != null && (
          <span className="text-neutral-500">
            Threshold{" "}
            <span className="text-neutral-900 font-medium">
              {thresholdDays} days
            </span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500">Status</span>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusInfo.bg}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
            <span className={`text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
        <div className="text-2xl font-semibold text-neutral-900 mb-1">
          {lastSeen
            ? formatDistanceToNow(new Date(lastSeen), { addSuffix: false })
            : "—"}
        </div>
        <div className="text-sm text-neutral-500">since last check-in</div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500">Threshold</span>
          <Clock className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-semibold text-neutral-900 mb-1">
          {thresholdDays ?? "—"}
        </div>
        <div className="text-sm text-neutral-500">days without activity</div>
      </div>
    </div>
  );
}
