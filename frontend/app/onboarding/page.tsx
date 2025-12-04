"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
  
  const { authenticated, user, login } = usePrivy();
  const { address } = useAccount();
  const walletAddress = address || user?.wallet?.address;

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({ hash });

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
      alert(`Transaction failed: ${writeError.message}`);
      reset();
    }
    if (txError) {
      console.error('Transaction error:', txError);
      alert(`Transaction failed: ${txError.message}`);
    }
  }, [writeError, txError, reset]);

  const handleRegister = () => {
    const validGuardians = guardians.filter(g => g && g.startsWith('0x') && g.length === 42);
    
    // Pad guardians to always have 3 (contract expects address[3])
    const paddedGuardians = [...validGuardians];
    while (paddedGuardians.length < 3) {
      paddedGuardians.push('0x0000000000000000000000000000000000000000');
    }

    try {
      writeContract({
        address: CHARON_SWITCH_ADDRESS,
        abi: CHARON_SWITCH_ABI,
        functionName: "register",
        args: [
          BigInt(threshold * 86400), 
          paddedGuardians.slice(0, 3) as [`0x${string}`, `0x${string}`, `0x${string}`],
          BigInt(2) // Required confirmations
        ],
      });
    } catch (err) {
      console.error('Registration error:', err);
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
            <p className="text-neutral-500">
              Guardians are trusted people who can verify your status
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {guardians.map((guardian, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Guardian {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={guardian}
                  onChange={(e) => {
                    const newGuardians = [...guardians];
                    newGuardians[index] = e.target.value;
                    setGuardians(newGuardians);
                  }}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:ring-0 outline-none transition-colors"
                />
              </div>
            ))}
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
            disabled={isPending || isConfirming}
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
