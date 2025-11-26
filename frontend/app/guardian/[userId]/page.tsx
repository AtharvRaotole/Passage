"use client";

import { useParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS, UserStatus } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { formatDistanceToNow, addHours, isPast } from "date-fns";
import { GuardianConfirmationModal } from "@/components/GuardianConfirmationModal";
import { GracePeriodExtensionModal } from "@/components/GracePeriodExtensionModal";

export default function GuardianPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { address, isConnected } = useAccount();
  
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [gracePeriodEnd, setGracePeriodEnd] = useState<Date | null>(null);
  const [extensionsUsed, setExtensionsUsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Read user info from contract
  const { data: userInfo, refetch } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: [userId as `0x${string}`],
    query: {
      enabled: !!userId && userId.startsWith("0x"),
    },
  });

  // Check if current address is a guardian
  const { data: hasConfirmed } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "hasGuardianConfirmed",
    args: userId && address ? [userId as `0x${string}`, address] : undefined,
    query: {
      enabled: !!userId && !!address && userId.startsWith("0x"),
    },
  });

  // Write contract for guardian confirmation
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  // Initialize grace period (72 hours from verification initiation)
  useEffect(() => {
    if (userInfo && userInfo[1]) {
      // Assuming verification was initiated, add 72 hours
      const verificationTime = Number(userInfo[1]) * 1000; // lastSeen timestamp
      const endTime = addHours(new Date(verificationTime), 72);
      setGracePeriodEnd(endTime);
    }
  }, [userInfo]);

  // Update countdown timer
  useEffect(() => {
    if (!gracePeriodEnd) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (isPast(gracePeriodEnd)) {
        setTimeRemaining("Grace period expired");
        clearInterval(interval);
      } else {
        setTimeRemaining(formatDistanceToNow(gracePeriodEnd, { addSuffix: true }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gracePeriodEnd]);

  const handleConfirmDeath = () => {
    if (!address || !userId) return;
    setShowConfirmationModal(true);
  };

  const handleConfirmSignature = () => {
    if (!address || !userId) return;
    
    writeContract({
      address: CHARON_SWITCH_ADDRESS,
      abi: CHARON_SWITCH_ABI,
      functionName: "guardianConfirm",
      args: [userId as `0x${string}`],
    });
    
    setShowConfirmationModal(false);
  };

  const handleRequestExtension = () => {
    setShowExtensionModal(true);
  };

  const handleExtendGracePeriod = async () => {
    // In production, this would call a contract function or API
    // For now, we'll extend locally
    if (extensionsUsed < 2 && gracePeriodEnd) {
      const newEndTime = addHours(gracePeriodEnd, 24);
      setGracePeriodEnd(newEndTime);
      setExtensionsUsed(extensionsUsed + 1);
      setShowExtensionModal(false);
    }
  };

  // Update data after transaction
  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  const status = userInfo?.[0] !== undefined ? Number(userInfo[0]) : null;
  const guardians = userInfo?.[3] || [];
  const requiredConfirmations = userInfo?.[4] ? Number(userInfo[4]) : 0;
  const confirmationCount = userInfo?.[5] ? Number(userInfo[5]) : 0;
  const isPendingVerification = status === UserStatus.PENDING_VERIFICATION;
  const isGuardian = guardians.includes(address?.toLowerCase() || "");
  const hasAlreadyConfirmed = hasConfirmed === true;
  const isExpired = gracePeriodEnd ? isPast(gracePeriodEnd) : false;
  const isUrgent = gracePeriodEnd 
    ? gracePeriodEnd.getTime() - Date.now() < 24 * 60 * 60 * 1000 // Less than 24 hours
    : false;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-gray-900 flex items-center justify-center">
        <Card className="bg-white max-w-md border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Guardian Access</CardTitle>
            <CardDescription className="text-gray-600">
              Connect your wallet to access the guardian portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isGuardian) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-gray-900 flex items-center justify-center p-8">
        <Card className="bg-white max-w-2xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Access Denied</CardTitle>
            <CardDescription className="text-gray-600">
              You are not listed as a guardian for this user.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900">
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-3xl font-serif text-gray-900">
              Guardian Verification Portal
            </h1>
            <p className="text-gray-600 mt-2">
              Death verification request for user
            </p>
            <p className="text-sm text-gray-500 font-mono mt-1">{userId}</p>
          </div>
          <ConnectButton />
        </div>

        {/* Verification Status Card */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Verification Status</CardTitle>
            <CardDescription className="text-gray-600">
              Current status of the death verification process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isPendingVerification ? "Pending Verification" : "Not Pending"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Oracle Result</p>
                <p className="text-lg font-semibold text-gray-700">
                  Uncertain - Guardian Confirmation Required
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Verification Initiated</p>
              <p className="text-gray-900">
                {userInfo?.[1] 
                  ? formatDistanceToNow(new Date(Number(userInfo[1]) * 1000), { addSuffix: true })
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Consensus Card */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Guardian Consensus</CardTitle>
            <CardDescription className="text-gray-600">
              {confirmationCount} of {requiredConfirmations} guardians have confirmed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {guardians.map((guardian: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      guardian.toLowerCase() === address?.toLowerCase()
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`} />
                    <span className="text-sm font-mono text-gray-700">
                      {guardian.slice(0, 6)}...{guardian.slice(-4)}
                    </span>
                    {guardian.toLowerCase() === address?.toLowerCase() && (
                      <span className="text-xs text-blue-600">(You)</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {hasAlreadyConfirmed && guardian.toLowerCase() === address?.toLowerCase()
                      ? "✓ Confirmed"
                      : "Pending"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-semibold text-gray-900">
                  {confirmationCount} / {requiredConfirmations}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full transition-all"
                  style={{ width: `${(confirmationCount / requiredConfirmations) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grace Period Card */}
        <Card className={`bg-white border-2 ${
          isUrgent ? "border-red-300" : isExpired ? "border-red-500" : "border-gray-200"
        }`}>
          <CardHeader>
            <CardTitle className={`${
              isUrgent ? "text-red-700" : isExpired ? "text-red-900" : "text-gray-900"
            }`}>
              Grace Period
            </CardTitle>
            <CardDescription className="text-gray-600">
              Time remaining before automatic execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className={`text-4xl font-bold mb-2 ${
                isUrgent ? "text-red-600" : isExpired ? "text-red-800" : "text-gray-900"
              }`}>
                {isExpired ? "EXPIRED" : timeRemaining || "Calculating..."}
              </p>
              {isUrgent && !isExpired && (
                <p className="text-sm text-red-600 font-semibold">
                  ⚠ Urgent: Less than 24 hours remaining
                </p>
              )}
            </div>
            {extensionsUsed < 2 && !isExpired && (
              <Button
                onClick={handleRequestExtension}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                I need more time to verify (Extensions used: {extensionsUsed}/2)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Action Card */}
        {isPendingVerification && !hasAlreadyConfirmed && !isExpired && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Your Action Required</CardTitle>
              <CardDescription className="text-gray-600">
                Please carefully verify the information before confirming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  As a guardian, you have been asked to confirm the death verification
                  for this user. This is a solemn responsibility. Please take time to
                  verify the information through appropriate channels before proceeding.
                </p>
              </div>
              <Button
                onClick={handleConfirmDeath}
                disabled={isPending || isConfirming}
                className="w-full bg-gray-900 text-white hover:bg-gray-800 py-6 text-lg font-semibold"
              >
                {isPending || isConfirming
                  ? "Processing..."
                  : "Confirm Death Verification"}
              </Button>
              {isConfirmed && (
                <p className="text-green-700 text-sm text-center">
                  ✓ Confirmation submitted successfully
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {hasAlreadyConfirmed && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-green-800 text-center font-semibold">
                ✓ You have already confirmed this verification
              </p>
            </CardContent>
          </Card>
        )}

        {isExpired && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-800 text-center font-semibold">
                Grace period has expired. Digital will execution may proceed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <GuardianConfirmationModal
          userId={userId}
          onConfirm={handleConfirmSignature}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}

      {/* Extension Modal */}
      {showExtensionModal && (
        <GracePeriodExtensionModal
          extensionsUsed={extensionsUsed}
          onConfirm={handleExtendGracePeriod}
          onCancel={() => setShowExtensionModal(false)}
        />
      )}
    </div>
  );
}

