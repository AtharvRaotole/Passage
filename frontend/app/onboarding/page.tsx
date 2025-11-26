"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ff00] to-[#00cc00] mb-4">
            Let's set up your digital safety net
          </h1>
          <p className="text-gray-400 text-lg">
            Protect what matters most. We'll guide you through it step by step.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}

