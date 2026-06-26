/**
 * Digital will API client — encrypt client-side, persist via backend
 */

import {
  CreateWillPayload,
  WillAuthHeaders,
  WillEntry,
  WillEntryFormData,
  WillListResponse,
  buildWillAuthMessage,
} from "@/types/will";
import {
  encryptCredential,
  encryptCredentialDev,
  isWillLitEnabled,
} from "@/utils/litCharon";

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

export async function signWillRequest(
  address: string,
  signMessageAsync: (args: { message: string }) => Promise<string>
): Promise<WillAuthHeaders> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = buildWillAuthMessage(address, timestamp);
  const signature = await signMessageAsync({ message });
  return {
    "X-Will-Address": address,
    "X-Will-Signature": signature,
    "X-Will-Timestamp": String(timestamp),
  };
}

export async function encryptAndPrepareWill(
  entry: WillEntryFormData,
  userAddress: string
): Promise<CreateWillPayload> {
  const passwordPayload = isWillLitEnabled()
    ? await encryptCredential(entry.password, userAddress)
    : encryptCredentialDev(entry.password, userAddress);

  let encryptedTotp: string | undefined;
  if (entry.totpSecret) {
    const totpPayload = isWillLitEnabled()
      ? await encryptCredential(entry.totpSecret, userAddress)
      : encryptCredentialDev(entry.totpSecret, userAddress);
    encryptedTotp = totpPayload.ciphertext;
  }

  return {
    website_url: entry.websiteUrl.trim(),
    username: entry.username.trim(),
    encrypted_password: passwordPayload.ciphertext,
    password_hash: passwordPayload.dataToEncryptHash,
    encrypted_symmetric_key: passwordPayload.encryptedSymmetricKey,
    access_control_conditions: passwordPayload.accessControlConditions,
    instruction: entry.instruction.trim(),
    totp_secret: encryptedTotp,
  };
}

async function willFetch<T>(
  path: string,
  auth: WillAuthHeaders,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export async function fetchWills(
  address: string,
  auth: WillAuthHeaders
): Promise<WillEntry[]> {
  const data = await willFetch<WillListResponse>(
    `/api/wills?user_address=${encodeURIComponent(address)}`,
    auth,
    { method: "GET" }
  );
  return data.wills;
}

export async function createWill(
  payload: CreateWillPayload,
  auth: WillAuthHeaders
): Promise<WillEntry> {
  return willFetch<WillEntry>("/api/wills", auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function batchCreateWills(
  payloads: CreateWillPayload[],
  auth: WillAuthHeaders
): Promise<WillEntry[]> {
  const data = await willFetch<WillListResponse>("/api/wills/batch", auth, {
    method: "POST",
    body: JSON.stringify({ wills: payloads }),
  });
  return data.wills;
}

export async function deleteWill(
  willId: string,
  auth: WillAuthHeaders
): Promise<void> {
  await willFetch<void>(`/api/wills/${willId}`, auth, { method: "DELETE" });
}

export const LEGACY_CREDENTIALS_KEY = "passage_credentials";

export function hasLegacyLocalCredentials(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(LEGACY_CREDENTIALS_KEY);
}

export function clearLegacyLocalCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_CREDENTIALS_KEY);
}
