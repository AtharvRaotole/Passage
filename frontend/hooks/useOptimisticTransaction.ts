"use client";

import { useState, useCallback } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useStatusCenter } from "@/components/StatusCenter";

interface OptimisticTransaction {
  hash: `0x${string}`;
  type: "blockchain";
  title: string;
  description: string;
}

/**
 * Hook for managing optimistic blockchain transactions
 * Shows immediate UI feedback while transaction is pending confirmation
 */
export function useOptimisticTransaction() {
  const { addStatus, updateStatus, dismissStatus } = useStatusCenter();
  const [optimisticData, setOptimisticData] = useState<Map<string, any>>(new Map());

  const addOptimisticTransaction = useCallback(
    (tx: OptimisticTransaction, optimisticData?: any) => {
      const statusId = addStatus({
        type: "blockchain",
        title: tx.title,
        description: tx.description,
        status: "pending",
      });

      // Store optimistic data
      if (optimisticData) {
        setOptimisticData((prev) => {
          const newMap = new Map(prev);
          newMap.set(tx.hash, optimisticData);
          return newMap;
        });
      }

      return { statusId, optimisticData };
    },
    [addStatus]
  );

  const trackTransaction = useCallback(
    (hash: `0x${string}`, statusId: string) => {
      // This will be called by the component using useWaitForTransactionReceipt
      // The component should call updateStatus when transaction status changes
      return { hash, statusId };
    },
    []
  );

  return {
    addOptimisticTransaction,
    trackTransaction,
    optimisticData,
    updateStatus,
    dismissStatus,
  };
}

/**
 * Hook that combines wagmi's useWaitForTransactionReceipt with optimistic updates
 */
export function useOptimisticWaitForTransaction(
  hash: `0x${string}` | undefined,
  statusId: string | undefined,
  onSuccess?: () => void,
  onError?: () => void
) {
  const { updateStatus, dismissStatus } = useStatusCenter();

  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  // Update status based on transaction state
  if (statusId) {
    if (isLoading) {
      updateStatus(statusId, {
        status: "processing",
        description: "Waiting for blockchain confirmation...",
      });
    } else if (isSuccess) {
      updateStatus(statusId, {
        status: "completed",
        description: "Transaction confirmed on blockchain",
      });
      onSuccess?.();
      // Auto-dismiss after 3 seconds
      setTimeout(() => dismissStatus(statusId), 3000);
    } else if (isError) {
      updateStatus(statusId, {
        status: "failed",
        description: "Transaction failed",
      });
      onError?.();
    }
  }

  return { isLoading, isSuccess, isError };
}

