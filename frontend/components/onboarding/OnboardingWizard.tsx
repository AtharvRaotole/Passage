"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from "wagmi";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { saveUserOnboarding } from "@/utils/userApi";
import {
  batchCreateWills,
  encryptAndPrepareWill,
  signWillRequest,
} from "@/utils/willStorage";
import { Step1Wallet } from "./Step1Wallet";
import { Step2Guardians } from "./Step2Guardians";
import { Step3Accounts } from "./Step3Accounts";
import { Step4Instructions } from "./Step4Instructions";
import { Step5Review } from "./Step5Review";
import { PersonaSelector } from "./PersonaSelector";
import { CompletionBadge } from "./CompletionBadge";

export interface OnboardingData {
  persona?: string;
  // Step 1
  heartbeatInterval: number; // days
  heartbeatIntervalSeconds: number;
  
  // Step 2
  guardians: string[];
  guardianTemplate: "family" | "lawyer" | "custom";
  requiredConfirmations: number;
  
  // Step 3
  accounts: Array<{
    service: string;
    username: string;
    password?: string;
    type: "oauth" | "manual";
    imported: boolean;
  }>;
  
  // Step 4
  instructions: Array<{
    service: string;
    instruction: string;
  }>;
  
  // Step 5
  encrypted: boolean;
}

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const router = useRouter();
  const { authenticated, user, getAccessToken } = usePrivy();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const walletAddress = address || user?.wallet?.address;
  const [currentStep, setCurrentStep] = useState(1);
  const [showPersonaSelector, setShowPersonaSelector] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const savedRef = useRef(false);
  
  const [data, setData] = useState<OnboardingData>({
    heartbeatInterval: 30,
    heartbeatIntervalSeconds: 30 * 24 * 60 * 60,
    guardians: [],
    guardianTemplate: "family",
    requiredConfirmations: 2,
    accounts: [],
    instructions: [],
    encrypted: false,
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Calculate completion percentage
  useEffect(() => {
    let percentage = 0;
    
    // Step 1: Authenticated = 20%
    if (authenticated && walletAddress) percentage += 20;
    
    // Step 2: Guardians set = 20%
    if (data.guardians.length === 3) percentage += 20;
    
    // Step 3: Accounts imported = 20%
    if (data.accounts.length > 0) percentage += 20;
    
    // Step 4: Instructions set = 20%
    if (data.instructions.length > 0) percentage += 20;
    
    // Step 5: Encrypted = 20% (but we'll add this when they complete)
    
    setCompletionPercentage(percentage);
    
    // Award badges
    const badges: string[] = [];
    if (authenticated) badges.push("wallet-connected");
    if (data.guardians.length === 3) badges.push("guardians-set");
    if (data.accounts.length >= 3) badges.push("accounts-imported");
    if (data.instructions.length >= 3) badges.push("instructions-ready");
    setEarnedBadges(badges);
  }, [authenticated, walletAddress, data]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePersonaSelect = (persona: {
    id: string;
    accounts: OnboardingData["accounts"];
    instructions: OnboardingData["instructions"];
  }) => {
    setData({
      ...data,
      persona: persona.id,
      accounts: persona.accounts,
      instructions: persona.instructions,
    });
    setShowPersonaSelector(false);
  };

  const handleComplete = async () => {
    if (!walletAddress || !authenticated) {
      alert("Please log in first");
      return;
    }

    if (data.guardians.length !== 3) {
      alert("Please set 3 guardians");
      return;
    }

    // Register on CharonSwitch
    const guardians: [`0x${string}`, `0x${string}`, `0x${string}`] = [
      data.guardians[0] as `0x${string}`,
      data.guardians[1] as `0x${string}`,
      data.guardians[2] as `0x${string}`,
    ];

    writeContract({
      address: CHARON_SWITCH_ADDRESS,
      abi: CHARON_SWITCH_ABI,
      functionName: "register",
      args: [
        BigInt(data.heartbeatIntervalSeconds),
        guardians,
        BigInt(data.requiredConfirmations),
      ],
    });
  };

  // Persist onboarding after on-chain registration succeeds
  useEffect(() => {
    const address = walletAddress;
    if (!isConfirmed || !address || savedRef.current) return;

    savedRef.current = true;
    let cancelled = false;

    async function persistOnboarding() {
      setIsSavingOnboarding(true);
      setSaveError(null);

      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("Missing access token — please sign in again");
        }
        if (!address) {
          throw new Error("Wallet not connected");
        }

        await saveUserOnboarding(token, {
          walletAddress: address,
          persona: data.persona,
          heartbeatIntervalDays: data.heartbeatInterval,
          requiredConfirmations: data.requiredConfirmations,
          guardianTemplate: data.guardianTemplate,
          guardians: data.guardians,
          accounts: data.accounts.map(({ service, username, type, imported }) => ({
            service,
            username,
            type,
            imported,
          })),
          instructions: data.instructions,
        });

        const accountsWithPasswords = data.accounts.filter((a) => a.password);
        if (accountsWithPasswords.length > 0) {
          const auth = await signWillRequest(walletAddress, signMessageAsync);
          const payloads = await Promise.all(
            accountsWithPasswords.map((account) => {
              const instruction =
                data.instructions.find((i) => i.service === account.service)
                  ?.instruction || "";
              return encryptAndPrepareWill(
                {
                  websiteUrl: account.service,
                  username: account.username,
                  password: account.password!,
                  instruction,
                },
                walletAddress
              );
            })
          );
          await batchCreateWills(payloads, auth);
        }

        if (!cancelled) {
          router.push("/dashboard?onboarded=true");
        }
      } catch (err) {
        savedRef.current = false;
        if (!cancelled) {
          setSaveError(
            err instanceof Error ? err.message : "Failed to save onboarding data"
          );
        }
      } finally {
        if (!cancelled) {
          setIsSavingOnboarding(false);
        }
      }
    }

    persistOnboarding();
    return () => {
      cancelled = true;
    };
  }, [
    isConfirmed,
    walletAddress,
    data,
    getAccessToken,
    signMessageAsync,
    router,
  ]);

  if (showPersonaSelector) {
    return <PersonaSelector onSelect={handlePersonaSelect} />;
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-gray-400">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm font-mono text-[#00ff00]">
              {completionPercentage}% Complete
            </span>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
          
          {/* Completion Metric */}
          {completionPercentage > 0 && (
            <div className="mt-4 p-3 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
              <p className="text-sm font-mono text-[#00ff00]">
                ✨ You've protected {completionPercentage}% of your digital life
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      {saveError && (
        <div className="p-4 bg-red-950/50 border border-red-500/30 rounded text-red-300 text-sm font-mono">
          Failed to save profile: {saveError}
        </div>
      )}

      {isSavingOnboarding && (
        <div className="p-4 bg-[#00ff00]/10 border border-[#00ff00]/20 rounded text-[#00ff00] text-sm font-mono">
          Saving your profile and encrypted credentials…
        </div>
      )}

      {earnedBadges.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {earnedBadges.map((badge) => (
            <CompletionBadge key={badge} badge={badge} />
          ))}
        </div>
      )}

      {/* Step Content */}
      <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm min-h-[500px]">
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <Step1Wallet
              data={data}
              setData={setData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <Step2Guardians
              data={data}
              setData={setData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <Step3Accounts
              data={data}
              setData={setData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <Step4Instructions
              data={data}
              setData={setData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <Step5Review
              data={data}
              onComplete={handleComplete}
              onBack={handleBack}
              isPending={isPending || isConfirming}
              isSuccess={isConfirmed}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

