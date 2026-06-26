/**
 * User profile API client — Privy Bearer token auth
 */

import {
  OnboardingSavePayload,
  UserOnboarding,
  UserProfile,
  UserSyncPayload,
} from "@/types/user";

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

async function userFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function syncUser(
  accessToken: string,
  payload: UserSyncPayload
): Promise<UserProfile> {
  return userFetch<UserProfile>("/api/users/sync", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  return userFetch<UserProfile>("/api/users/me", accessToken);
}

export async function fetchUserOnboarding(
  accessToken: string
): Promise<UserOnboarding> {
  return userFetch<UserOnboarding>("/api/users/me/onboarding", accessToken);
}

export async function saveUserOnboarding(
  accessToken: string,
  payload: OnboardingSavePayload
): Promise<UserOnboarding> {
  return userFetch<UserOnboarding>("/api/users/onboarding", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
