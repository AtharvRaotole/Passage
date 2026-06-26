/** User profile and onboarding API types */

export interface UserProfile {
  id: string;
  privyUserId: string;
  walletAddress: string;
  email?: string | null;
  displayName?: string | null;
  persona?: string | null;
  heartbeatIntervalDays?: number | null;
  requiredConfirmations?: number | null;
  guardianTemplate?: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UserSyncPayload {
  walletAddress: string;
  email?: string;
  displayName?: string;
}

export interface OnboardingAccountPayload {
  service: string;
  username: string;
  type: "oauth" | "manual";
  imported: boolean;
}

export interface OnboardingInstructionPayload {
  service: string;
  instruction: string;
}

export interface OnboardingSavePayload {
  walletAddress: string;
  persona?: string;
  heartbeatIntervalDays?: number;
  requiredConfirmations?: number;
  guardianTemplate?: string;
  guardians: string[];
  accounts: OnboardingAccountPayload[];
  instructions: OnboardingInstructionPayload[];
}

export interface UserOnboarding extends UserProfile {
  guardians: Array<{ address: string; position: number }>;
  accounts: OnboardingAccountPayload[];
  instructions: OnboardingInstructionPayload[];
}
