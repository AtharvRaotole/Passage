import { AlertCircle, CheckCircle2, Clock, LucideIcon } from "lucide-react";
import { UserStatus } from "@/lib/contracts";

export interface PulseStatusInfo {
  text: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export function parseUserInfo(userInfo: readonly unknown[] | undefined) {
  const status = userInfo?.[0] !== undefined ? Number(userInfo[0]) : null;
  const lastSeen = userInfo?.[1] ? Number(userInfo[1]) * 1000 : null;
  const threshold = userInfo?.[2] ? Number(userInfo[2]) : null;
  return { status, lastSeen, threshold };
}

export function thresholdToDays(thresholdSeconds: number | null): number | null {
  if (!thresholdSeconds) return null;
  return Math.floor(thresholdSeconds / 86400);
}

export function getPulseStatusInfo(status: number | null): PulseStatusInfo {
  switch (status) {
    case UserStatus.ALIVE:
      return {
        text: "Active",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: CheckCircle2,
      };
    case UserStatus.PENDING_VERIFICATION:
      return {
        text: "Pending",
        color: "text-amber-600",
        bg: "bg-amber-50",
        icon: AlertCircle,
      };
    case UserStatus.DECEASED:
      return {
        text: "Triggered",
        color: "text-red-600",
        bg: "bg-red-50",
        icon: AlertCircle,
      };
    default:
      return {
        text: "Not Registered",
        color: "text-neutral-500",
        bg: "bg-neutral-50",
        icon: Clock,
      };
  }
}

export function getAppUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getPulseUrl(): string {
  return `${getAppUrl()}/pulse`;
}

export function computeRelevantDate(
  lastSeenMs: number | null,
  thresholdSeconds: number | null
): string | undefined {
  if (!lastSeenMs || !thresholdSeconds) return undefined;
  const dueAt = lastSeenMs + thresholdSeconds * 1000;
  return new Date(dueAt).toISOString();
}
