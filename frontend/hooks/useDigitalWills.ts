"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "@/hooks/use-toast";
import { WillEntry, WillEntryFormData } from "@/types/will";
import {
  createWill,
  deleteWill,
  encryptAndPrepareWill,
  fetchWills,
  signWillRequest,
} from "@/utils/willStorage";
import { isWillLitEnabled } from "@/utils/litCharon";

export function useDigitalWills() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const queryKey = ["wills", address];

  const willsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!address) return [];
      const auth = await signWillRequest(address, signMessageAsync);
      return fetchWills(address, auth);
    },
    enabled: !!address,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (entry: WillEntryFormData) => {
      if (!address) throw new Error("Connect your wallet");
      const payload = await encryptAndPrepareWill(entry, address);
      const auth = await signWillRequest(address, signMessageAsync);
      return createWill(payload, auth);
    },
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WillEntry[]>(queryKey) || [];
      const optimistic: WillEntry = {
        id: `optimistic_${Date.now()}`,
        website_url: entry.websiteUrl,
        username: entry.username,
        instruction: entry.instruction,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<WillEntry[]>(queryKey, [...previous, optimistic]);
      return { previous };
    },
    onError: (err, _entry, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Saved",
        description: isWillLitEnabled()
          ? "Credential encrypted and stored securely"
          : "Stored (dev mode — Lit encryption disabled)",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (willId: string) => {
      if (!address) throw new Error("Connect your wallet");
      const auth = await signWillRequest(address, signMessageAsync);
      await deleteWill(willId, auth);
      return willId;
    },
    onMutate: async (willId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WillEntry[]>(queryKey) || [];
      queryClient.setQueryData<WillEntry[]>(
        queryKey,
        previous.filter((w) => w.id !== willId)
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Will entry removed" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addWill = useCallback(
    (entry: WillEntryFormData) => createMutation.mutateAsync(entry),
    [createMutation]
  );

  const removeWill = useCallback(
    (willId: string) => deleteMutation.mutateAsync(willId),
    [deleteMutation]
  );

  return {
    wills: willsQuery.data ?? [],
    isLoading: willsQuery.isLoading,
    isFetching: willsQuery.isFetching,
    error: willsQuery.error,
    refetch: willsQuery.refetch,
    addWill,
    removeWill,
    isSaving: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLitEnabled: isWillLitEnabled(),
  };
}
