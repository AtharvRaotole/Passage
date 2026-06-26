"use client";

import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { fetchUserProfile, syncUser } from "@/utils/userApi";
import { UserProfile } from "@/types/user";

export function useUserProfile() {
  const { authenticated, user, getAccessToken } = usePrivy();
  const { address } = useAccount();
  const walletAddress = address || user?.wallet?.address;

  return useQuery<UserProfile>({
    queryKey: ["userProfile", walletAddress],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      await syncUser(token, {
        walletAddress,
        email: user?.email?.address,
        displayName: user?.email?.address ?? undefined,
      });

      return fetchUserProfile(token);
    },
    enabled: authenticated && !!walletAddress,
    staleTime: 60_000,
    retry: 1,
  });
}
