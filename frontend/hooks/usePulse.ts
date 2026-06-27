"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS } from "@/lib/contracts";
import { getPulseStatusInfo, parseUserInfo } from "@/lib/pulseUtils";

export function usePulse() {
  const { authenticated, user } = usePrivy();
  const { address } = useAccount();

  const walletAddress = address || user?.wallet?.address;

  const {
    data: userInfo,
    refetch,
    isLoading: isLoadingUserInfo,
  } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!walletAddress && authenticated,
    },
  });

  const { writeContract, data: hash, isPending, error: writeError } =
    useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  const { status, lastSeen, threshold } = parseUserInfo(userInfo);
  const statusInfo = getPulseStatusInfo(status);

  const handlePulse = () => {
    if (!walletAddress) return;
    writeContract({
      address: CHARON_SWITCH_ADDRESS,
      abi: CHARON_SWITCH_ABI,
      functionName: "pulse",
    });
  };

  const error =
    writeError?.message || receiptError?.message || null;

  return {
    walletAddress,
    authenticated,
    status,
    lastSeen,
    threshold,
    statusInfo,
    handlePulse,
    isPending,
    isConfirming,
    isSuccess,
    isLoadingUserInfo,
    error,
    refetch,
    hash,
  };
}
