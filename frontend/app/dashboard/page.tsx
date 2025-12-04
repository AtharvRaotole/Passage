"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS, UserStatus } from "@/lib/contracts";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { 
  Shield, 
  Heart, 
  Clock, 
  Wallet, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Settings,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const { authenticated, user, login, logout } = usePrivy();
  const { address } = useAccount();
  
  const walletAddress = address || user?.wallet?.address;
  
  const { data: userInfo, refetch } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!walletAddress && authenticated,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const handlePulse = () => {
    if (!walletAddress) return;
    writeContract({
      address: CHARON_SWITCH_ADDRESS,
      abi: CHARON_SWITCH_ABI,
      functionName: "pulse",
    });
  };

  if (isConfirmed) {
    refetch();
  }

  const status = userInfo?.[0] !== undefined ? Number(userInfo[0]) : null;
  const lastSeen = userInfo?.[1] ? Number(userInfo[1]) * 1000 : null;
  const threshold = userInfo?.[2] ? Number(userInfo[2]) : null;

  const getStatusInfo = (status: number | null) => {
    switch (status) {
      case UserStatus.ALIVE:
        return { text: "Active", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 };
      case UserStatus.PENDING_VERIFICATION:
        return { text: "Pending", color: "text-amber-600", bg: "bg-amber-50", icon: AlertCircle };
      case UserStatus.DECEASED:
        return { text: "Triggered", color: "text-red-600", bg: "bg-red-50", icon: AlertCircle };
      default:
        return { text: "Not Registered", color: "text-neutral-500", bg: "bg-neutral-50", icon: Clock };
    }
  };

  const statusInfo = getStatusInfo(status);

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              Passage
            </Link>
            <h1 className="mt-8 text-2xl font-medium text-neutral-900">
              Welcome back
            </h1>
            <p className="mt-2 text-neutral-500">
              Sign in to access your digital estate dashboard
            </p>
          </div>
          
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <button
              onClick={login}
              className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Sign in
            </button>
            <p className="mt-4 text-center text-sm text-neutral-500">
              Sign in with email, Google, or your wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
        {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Passage
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">
              {user?.email?.address || (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '')}
            </span>
            <button 
              onClick={logout}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Overview */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-neutral-500">Status</span>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusInfo.bg}`}>
                  <statusInfo.icon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                  <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
              </div>
              <div className="text-3xl font-semibold text-neutral-900 mb-1">
                {lastSeen ? formatDistanceToNow(new Date(lastSeen), { addSuffix: false }) : '—'}
              </div>
              <div className="text-sm text-neutral-500">since last check-in</div>
            </div>

            {/* Threshold Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-neutral-500">Threshold</span>
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl font-semibold text-neutral-900 mb-1">
                {threshold ? Math.floor(threshold / 86400) : '—'}
              </div>
              <div className="text-sm text-neutral-500">days without activity</div>
            </div>

            {/* Pulse Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-neutral-500">Check-in</span>
                <Activity className="w-4 h-4 text-neutral-400" />
              </div>
              <button
                onClick={handlePulse}
                disabled={isPending || isConfirming}
                className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isPending || isConfirming) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Send Pulse
                  </>
                )}
              </button>
              {isConfirmed && (
                <p className="mt-2 text-center text-sm text-emerald-600">
                  Check-in confirmed
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wallet, title: "Crypto Vault", description: "Manage digital assets", href: "/dashboard/vault" },
              { icon: FileText, title: "Digital Will", description: "Account credentials", href: "/dashboard/will" },
              { icon: ImageIcon, title: "Memory Vault", description: "Photos & messages", href: "/dashboard/memories" },
              { icon: Search, title: "Asset Recovery", description: "Find unclaimed assets", href: "/dashboard/recovery" },
            ].map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                </div>
                <h3 className="mt-4 font-medium text-neutral-900">{action.title}</h3>
                <p className="text-sm text-neutral-500">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900">Settings & Security</h3>
                <p className="text-sm text-neutral-500">Manage guardians, thresholds, and security</p>
              </div>
            </div>
            <Link 
              href="/onboarding"
              className="text-sm font-medium text-neutral-900 hover:underline"
            >
              Configure
            </Link>
          </div>
      </div>
      </main>
    </div>
  );
}
