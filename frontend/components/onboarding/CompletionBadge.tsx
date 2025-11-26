"use client";

interface CompletionBadgeProps {
  badge: string;
}

const BADGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  "wallet-connected": {
    name: "Wallet Connected",
    icon: "🔗",
    color: "text-blue-400",
  },
  "guardians-set": {
    name: "Guardians Set",
    icon: "🛡️",
    color: "text-green-400",
  },
  "accounts-imported": {
    name: "Accounts Imported",
    icon: "📦",
    color: "text-purple-400",
  },
  "instructions-ready": {
    name: "Instructions Ready",
    icon: "📝",
    color: "text-yellow-400",
  },
};

export function CompletionBadge({ badge }: CompletionBadgeProps) {
  const info = BADGE_INFO[badge];
  if (!info) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded-full border border-[#00ff00]/20 ${info.color}`}>
      <span>{info.icon}</span>
      <span className="text-xs font-mono font-bold">{info.name}</span>
    </div>
  );
}

