"use client";

import { Activity, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PulseCheckInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  size?: "default" | "large";
  className?: string;
}

export function PulseCheckInButton({
  onClick,
  disabled = false,
  isPending = false,
  isConfirming = false,
  isSuccess = false,
  size = "default",
  className,
}: PulseCheckInButtonProps) {
  const loading = isPending || isConfirming;
  const isLarge = size === "large";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "w-full bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          isLarge ? "py-5 text-lg" : "py-3"
        )}
      >
        {loading ? (
          <>
            <Loader2 className={cn("animate-spin", isLarge ? "w-5 h-5" : "w-4 h-4")} />
            Processing...
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className={cn(isLarge ? "w-5 h-5" : "w-4 h-4")} />
            Checked in
          </>
        ) : (
          <>
            {isLarge ? (
              <Activity className="w-5 h-5" />
            ) : (
              <Heart className="w-4 h-4" />
            )}
            {isLarge ? "Check in now" : "Send Pulse"}
          </>
        )}
      </button>
      {isSuccess && !loading && (
        <p className="mt-2 text-center text-sm text-emerald-600 animate-fade-in">
          Check-in confirmed on-chain
        </p>
      )}
    </div>
  );
}
