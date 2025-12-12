"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS } from "@/lib/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2,
  Loader2,
  Wallet,
  PartyPopper
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Connect", description: "Link your wallet" },
  { id: 2, title: "Guardians", description: "Add trusted contacts" },
  { id: 3, title: "Settings", description: "Set your threshold" },
  { id: 4, title: "Complete", description: "Activate protection" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [guardians, setGuardians] = useState<string[]>(["", "", ""]);
  const [threshold, setThreshold] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { authenticated, user, login, logout } = usePrivy();
  const { address } = useAccount();
  const walletAddress = address || user?.wallet?.address;

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({ hash });

  // Check if user is already registered
  const { data: userInfo } = useReadContract({
    address: CHARON_SWITCH_ADDRESS,
    abi: CHARON_SWITCH_ABI,
    functionName: "getUserInfo",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!walletAddress && authenticated,
    },
  });

  // Don't auto-redirect - allow user to view onboarding flow for demo
  // Only show warning, don't block navigation

  // Auto redirect after successful transaction
  useEffect(() => {
    if (isConfirmed && hash) {
      setShowSuccess(true);
      // Auto redirect after 2 seconds
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, hash, router]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      let errorMessage = writeError.message;
      
      // Provide user-friendly error messages
      if (errorMessage.includes('UserNotRegistered') || errorMessage.includes('already registered')) {
        errorMessage = 'You are already registered. Please use a different wallet or contact support.';
      } else if (errorMessage.includes('InvalidGuardian')) {
        errorMessage = 'Invalid guardian address. Please check that all guardians are valid and unique.';
      } else if (errorMessage.includes('DuplicateGuardian')) {
        errorMessage = 'Duplicate guardian addresses detected. Each guardian must be unique.';
      } else if (errorMessage.includes('execution reverted')) {
        errorMessage = 'Transaction failed. Common causes:\n\n1. You are already registered with this wallet\n   → Try using a different wallet address\n\n2. Invalid guardian addresses\n   → Ensure all 3 guardians are unique and valid\n\n3. Insufficient balance for gas fees\n   → Add more funds to your wallet\n\n4. Network issues\n   → Check your network connection';
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
        errorMessage = 'Insufficient balance for gas fees. Please add funds to your wallet and try again.';
      }
      
      alert(`Transaction failed: ${errorMessage}`);
      reset();
    }
    if (txError) {
      console.error('Transaction error:', txError);
      alert(`Transaction failed: ${txError.message}`);
    }
  }, [writeError, txError, reset]);

  const handleRegister = () => {
    // Check if already registered - for demo, show message but allow viewing
    if (userInfo && userInfo[2] && Number(userInfo[2]) > 0) {
      const proceed = confirm('You are already registered with this wallet.\n\nFor demo purposes, you can:\n1. Use a different wallet address to register\n2. Or go to dashboard to view your existing registration\n\nClick OK to go to dashboard, or Cancel to stay here.');
      if (proceed) {
        router.push('/dashboard');
      }
      return;
    }

    const validGuardians = guardians.filter(g => g && g.startsWith('0x') && g.length === 42);
    
    // Contract requires exactly 3 unique, non-zero guardians that are not the sender
    if (validGuardians.length < 3) {
      alert('Please provide exactly 3 guardian wallet addresses');
      return;
    }

    // Check for duplicates (case-insensitive)
    const uniqueGuardians = [...new Set(validGuardians.map(g => g.toLowerCase()))];
    if (uniqueGuardians.length !== 3) {
      alert('Guardian addresses must be unique');
      return;
    }

    // Check that sender is not a guardian
    if (walletAddress) {
      const senderLower = walletAddress.toLowerCase();
      if (uniqueGuardians.includes(senderLower)) {
        alert('You cannot be your own guardian');
        return;
      }
    }

    // Ensure we have exactly 3 guardians (contract requires address[3])
    const finalGuardians = validGuardians.slice(0, 3).map(g => g as `0x${string}`) as [`0x${string}`, `0x${string}`, `0x${string}`];

    try {
      writeContract({
        address: CHARON_SWITCH_ADDRESS,
        abi: CHARON_SWITCH_ABI,
        functionName: "register",
        args: [
          BigInt(threshold * 86400), 
          finalGuardians,
          BigInt(2) // Required confirmations
        ],
        gas: BigInt(15000000), // Set gas limit below network cap (16.7M)
      });
    } catch (err) {
      console.error('Registration error:', err);
      alert('Failed to initiate registration. Please check your wallet balance and try again.');
    }
  };

  // Success Screen
  if (showSuccess || isConfirmed) {
    return (
      <OnboardingLayout currentStep={4}>
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-semibold text-neutral-900 mb-3">
            You're all set!
          </h2>
          <p className="text-neutral-500 mb-8">
            Your digital estate is now protected. Redirecting to dashboard...
          </p>
          
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Transaction Confirmed</span>
              </div>
              {hash && (
                <p className="text-xs text-emerald-600 mt-2 font-mono">
                  {hash.slice(0, 20)}...{hash.slice(-10)}
                </p>
              )}
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 1: Connect Wallet
  if (currentStep === 1) {
    return (
      <OnboardingLayout currentStep={currentStep}>
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
            Connect your wallet
          </h2>
          <p className="text-neutral-500 mb-8">
            Sign in to get started with your digital estate plan
          </p>
          
          {authenticated && walletAddress ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Connected</span>
                </div>
                <p className="text-sm text-emerald-600 mt-1">
                  {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </OnboardingLayout>
    );
  }

  // Step 2: Add Guardians
  if (currentStep === 2) {
    return (
      <OnboardingLayout currentStep={currentStep}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
              Add your guardians
            </h2>
            <p className="text-neutral-500 mb-2">
              Guardians are trusted people who can verify your status
            </p>
            <p className="text-xs text-neutral-400">
              Enter their wallet addresses (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)
            </p>
          </div>

          {/* Demo Test Addresses Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                const testAddresses = [
                  "0x3a20111c22309e36316e54e138b217980fd7b8ce",
                  "0x7803e858280d6791eca28b3ec7223b0d51943828",
                  "0xd52b80eca1e5c13e1f0150c34b1d35c658e6de4d"
                ];
                setGuardians(testAddresses);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 transition-colors"
            >
              🎲 Fill with Demo Test Addresses
            </button>
            <p className="text-xs text-neutral-400 mt-1 text-center">
              Quick fill for demos and testing
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {guardians.map((guardian, index) => {
              const isValidAddress = guardian && /^0x[a-fA-F0-9]{40}$/.test(guardian);
              const hasValue = guardian.length > 0;
              
              return (
                <div key={index}>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Guardian {index + 1} Wallet Address {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={guardian}
                    onChange={(e) => {
                      const newGuardians = [...guardians];
                      newGuardians[index] = e.target.value;
                      setGuardians(newGuardians);
                    }}
                    placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-0 outline-none transition-colors font-mono text-sm ${
                      hasValue && !isValidAddress
                        ? "border-red-300 focus:border-red-400 bg-red-50"
                        : isValidAddress
                        ? "border-green-300 focus:border-green-400 bg-green-50"
                        : "border-neutral-200 focus:border-neutral-400"
                    }`}
                  />
                  {hasValue && !isValidAddress && (
                    <p className="text-xs text-red-500 mt-1">
                      Invalid wallet address format. Must start with 0x and be 42 characters.
                    </p>
                  )}
                  {isValidAddress && (
                    <p className="text-xs text-green-600 mt-1">✓ Valid wallet address</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 3: Set Threshold
  if (currentStep === 3) {
    return (
      <OnboardingLayout currentStep={currentStep}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
              Set your threshold
            </h2>
            <p className="text-neutral-500">
              How many days without activity before verification starts?
            </p>
          </div>

          <div className="mb-8">
            <div className="text-center mb-6">
              <span className="text-5xl font-semibold text-neutral-900">{threshold}</span>
              <span className="text-xl text-neutral-500 ml-2">days</span>
            </div>
            <input
              type="range"
              min="7"
              max="365"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900"
            />
            <div className="flex justify-between text-sm text-neutral-500 mt-2">
              <span>7 days</span>
              <span>365 days</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 4: Activate
  // Check if already registered and show message
  const isAlreadyRegistered = userInfo && userInfo[2] && Number(userInfo[2]) > 0;

  return (
    <OnboardingLayout currentStep={currentStep}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
            Activate protection
          </h2>
          <p className="text-neutral-500">
            Review and confirm your settings
          </p>
        </div>

        {isAlreadyRegistered && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 mb-2">
              ⚠️ <strong>Demo Note:</strong> You are already registered with this wallet address.
            </p>
            <p className="text-xs text-amber-700 mb-3">
              For a fresh registration demo, use a different wallet address. You can still view the onboarding flow below.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Switch to a different wallet to register a new account?')) {
                    logout();
                  }
                }}
                className="flex-1 bg-neutral-200 text-neutral-700 py-2 rounded-lg font-medium hover:bg-neutral-300 transition-colors text-sm"
              >
                Switch Wallet
              </button>
            </div>
          </div>
        )}

        <div className="bg-neutral-50 rounded-xl p-6 mb-8 space-y-4">
          <div className="flex justify-between">
            <span className="text-neutral-500">Guardians</span>
            <span className="font-medium">{guardians.filter(g => g && g.startsWith('0x')).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Threshold</span>
            <span className="font-medium">{threshold} days</span>
          </div>
          {hash && (
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-2 text-amber-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for confirmation...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(3)}
            disabled={isPending || isConfirming}
            className="px-6 py-3 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleRegister}
            disabled={isPending || isConfirming || isAlreadyRegistered}
            className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                Activate
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        
        {(isPending || isConfirming) && (
          <p className="text-center text-sm text-neutral-500 mt-4">
            Please wait while your transaction is being processed...
          </p>
        )}
      </div>
    </OnboardingLayout>
  );
}

function OnboardingLayout({ children, currentStep }: { children: React.ReactNode; currentStep: number }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Passage
          </Link>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Exit
          </Link>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > step.id 
                      ? 'bg-neutral-900 text-white' 
                      : currentStep === step.id 
                        ? 'border-2 border-neutral-900' 
                        : 'border-2 border-neutral-200'
                  }`}>
                    {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="hidden sm:block text-sm">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${currentStep > step.id ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        {children}
      </main>
    </div>
  );
}
