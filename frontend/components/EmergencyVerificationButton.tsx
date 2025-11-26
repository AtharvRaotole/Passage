"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmergencyVerificationButtonProps {
  onRequestComplete?: (requestId: string) => void;
}

export function EmergencyVerificationButton({ onRequestComplete }: EmergencyVerificationButtonProps) {
  const { address } = useAccount();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleEmergencyVerification = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // For now, we'll use empty encrypted secrets (in production, encrypt SSN/PII with DON public key)
      // The source code would be loaded from a file or generated
      const sourceCode = `
        // Chainlink Functions source code for death verification
        const apiEndpoint = args[0];
        const userAddress = args[1];
        
        const response = await Functions.makeHttpRequest({
          url: apiEndpoint,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            address: userAddress,
          },
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        const isDeceased = response.data.deceased === true;
        return Functions.encodeString(isDeceased ? "1" : "0");
      `;

      // Convert source code to bytes
      const sourceCodeBytes = new TextEncoder().encode(sourceCode);

      writeContract({
        address: CHARON_SWITCH_ADDRESS,
        abi: CHARON_SWITCH_ABI,
        functionName: "emergencyVerification",
        args: ["0x", sourceCodeBytes], // Empty encrypted secrets for now (0x = empty bytes)
      });
    } catch (err: any) {
      setError(err.message || "Failed to request emergency verification");
      setIsRequesting(false);
    }
  };

  if (isSuccess && hash) {
    // Extract request ID from transaction receipt if needed
    if (onRequestComplete) {
      onRequestComplete(hash);
    }
    setIsRequesting(false);
  }

  return (
    <Card className="bg-white border-red-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Emergency Verification</CardTitle>
        <CardDescription className="text-gray-600">
          Manually trigger Chainlink Functions oracle query (costs LINK tokens)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> This will cost LINK tokens and is rate-limited to once per 7 days.
            Use this only if you need immediate verification outside the normal threshold period.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              ✓ Emergency verification requested. Transaction: {hash?.slice(0, 10)}...
            </p>
          </div>
        )}

        <Button
          onClick={handleEmergencyVerification}
          disabled={isPending || isConfirming || isRequesting}
          className="w-full bg-red-600 text-white hover:bg-red-700 font-semibold"
        >
          {isPending || isConfirming || isRequesting
            ? "Requesting..."
            : "Request Emergency Verification"}
        </Button>
      </CardContent>
    </Card>
  );
}

