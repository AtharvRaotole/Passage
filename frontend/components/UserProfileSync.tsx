"use client";

import { useUserProfile } from "@/hooks/useUserProfile";

/** Syncs Privy user to backend once per session when wallet is connected. */
export function UserProfileSync() {
  useUserProfile();
  return null;
}
