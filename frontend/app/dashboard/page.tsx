"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS, UserStatus } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DigitalWillForm } from "@/components/DigitalWillForm";
import { EmergencyVerificationButton } from "@/components/EmergencyVerificationButton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { DemoModeToggle } from "@/components/DemoModeToggle";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  
  // Read user info from contract
  const { data: userInfo, refetch } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Write contract for pulse
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  const handlePulse = () => {
    if (!address) return;
    
    writeContract({
      address: CHARON_SWITCH_ADDRESS,
      abi: CHARON_SWITCH_ABI,
      functionName: "pulse",
    });
  };

  // Update data after transaction
  if (isConfirmed) {
    refetch();
  }

  const status = userInfo?.[0] !== undefined ? userInfo[0] : null;
  const lastSeen = userInfo?.[1] ? Number(userInfo[1]) * 1000 : null;
  const threshold = userInfo?.[2] ? Number(userInfo[2]) : null;

  const getStatusText = (status: number | null) => {
    switch (status) {
      case UserStatus.ALIVE:
        return "ALIVE";
      case UserStatus.PENDING_VERIFICATION:
        return "PENDING_VERIFICATION";
      case UserStatus.DECEASED:
        return "DECEASED";
      default:
        return "UNKNOWN";
    }
  };

  const getStatusColor = (status: number | null) => {
    switch (status) {
      case UserStatus.ALIVE:
        return "text-green-400";
      case UserStatus.PENDING_VERIFICATION:
        return "text-yellow-400";
      case UserStatus.DECEASED:
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] flex items-center justify-center">
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              CHARON SYSTEM ACCESS
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your wallet to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Demo Mode Banner */}
        <DemoModeBanner />
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#00ff00]/20 pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-[#00ff00]">
              CHARON DASHBOARD
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              DIGITAL ESTATE MANAGEMENT SYSTEM v2.1.4
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Status Card */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              SYSTEM STATUS
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Current user state and heartbeat information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm font-mono mb-1">
                  STATUS:
                </p>
                <p className={`text-2xl font-mono font-bold ${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-mono mb-1">
                  LAST SEEN:
                </p>
                <p className="text-lg font-mono text-gray-300">
                  {lastSeen
                    ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true })
                    : "N/A"}
                </p>
              </div>
            </div>
            {threshold && (
              <div>
                <p className="text-gray-400 text-sm font-mono mb-1">
                  THRESHOLD:
                </p>
                <p className="text-lg font-mono text-gray-300">
                  {Math.floor(threshold / 86400)} days
                </p>
              </div>
            )}
            <Button
              onClick={handlePulse}
              disabled={isPending || isConfirming}
              className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg py-6 mt-4"
              size="lg"
            >
              {isPending || isConfirming
                ? "PROCESSING..."
                : "SEND PULSE"}
            </Button>
            {isConfirmed && (
              <p className="text-green-400 text-sm font-mono text-center">
                ✓ Pulse sent successfully
              </p>
            )}
          </CardContent>
        </Card>

        {/* Digital Will Form */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              DIGITAL WILL REGISTRY
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Encrypt and store your digital estate credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DigitalWillForm />
          </CardContent>
        </Card>

        {/* Emergency Verification */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              EMERGENCY VERIFICATION
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Manually trigger Chainlink Functions oracle query
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmergencyVerificationButton />
          </CardContent>
        </Card>

        {/* Crypto Vault Link */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              CRYPTO VAULT
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Manage your crypto assets and beneficiaries across multiple chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/vault">
              <Button className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg py-6">
                OPEN CRYPTO VAULT
              </Button>
            </Link>
            <p className="text-gray-400 text-xs font-mono mt-3 text-center">
              Multi-chain asset management • Automatic inheritance • Real-time portfolio tracking
            </p>
          </CardContent>
        </Card>

        {/* Memory Vault Link */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              MEMORY VAULT
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Preserve your memories. Share your legacy. Forever encrypted and stored on IPFS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/memories">
              <Button className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg py-6">
                OPEN MEMORY VAULT
              </Button>
            </Link>
            <p className="text-gray-400 text-xs font-mono mt-3 text-center">
              Upload photos, videos, letters • Create time capsules • Automatic memory book generation
            </p>
          </CardContent>
        </Card>

        {/* Recovery Dashboard Link */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              PROACTIVE ASSET RECOVERY
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Search for unclaimed property, life insurance, and treasury bonds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/recovery">
              <Button className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg py-6">
                ACCESS RECOVERY DASHBOARD
              </Button>
            </Link>
            <p className="text-gray-400 text-xs font-mono mt-3 text-center">
              $140B in unclaimed assets waiting to be recovered
            </p>
          </CardContent>
        </Card>

        {/* Demo Mode Toggle */}
        <DemoModeToggle />

        {/* Trust & Safety Link */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">
              TRUST & SAFETY
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Cryptographic proofs, security audits, and transparency reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/privacy">
              <Button className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg py-6">
                VIEW TRUST & SAFETY
              </Button>
            </Link>
            <p className="text-gray-400 text-xs font-mono mt-3 text-center">
              Security verification • Node distribution • Legal compliance reports
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

