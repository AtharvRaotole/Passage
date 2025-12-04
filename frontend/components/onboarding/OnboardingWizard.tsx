"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHARON_SWITCH_ABI, CHARON_SWITCH_ADDRESS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Step1Wallet } from "./Step1Wallet";
import { Step2Guardians } from "./Step2Guardians";
import { Step3Accounts } from "./Step3Accounts";
import { Step4Instructions } from "./Step4Instructions";
import { Step5Review } from "./Step5Review";
import { PersonaSelector } from "./PersonaSelector";
import { CompletionBadge } from "./CompletionBadge";

export interface OnboardingData {
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
  const { authenticated, user } = usePrivy();
  const { address } = useAccount();
  const walletAddress = address || user?.wallet?.address;
  const [currentStep, setCurrentStep] = useState(1);
  const [showPersonaSelector, setShowPersonaSelector] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  
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

  const handlePersonaSelect = (persona: any) => {
    setData({
      ...data,
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

  // Redirect to dashboard after successful registration
  useEffect(() => {
    if (isConfirmed) {
      // Save accounts and instructions to database (mock for now)
      console.log("Saving onboarding data:", data);
      
      setTimeout(() => {
        router.push("/dashboard?onboarded=true");
      }, 2000);
    }
  }, [isConfirmed, router, data]);

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

