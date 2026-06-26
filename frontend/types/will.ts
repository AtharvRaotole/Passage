/** Shared types for digital will feature */

export interface WillEntryFormData {
  websiteUrl: string;
  username: string;
  password: string;
  instruction: string;
  totpSecret?: string;
}

export interface CreateWillPayload {
  website_url: string;
  username: string;
  encrypted_password: string;
  password_hash: string;
  encrypted_symmetric_key: string;
  access_control_conditions: unknown[];
  instruction: string;
  totp_secret?: string;
}

export interface WillEntry {
  id: string;
  website_url: string;
  username: string;
  instruction: string;
  created_at: string;
}

export interface WillListResponse {
  wills: WillEntry[];
  total: number;
}

export interface WillAuthHeaders {
  "X-Will-Address": string;
  "X-Will-Signature": string;
  "X-Will-Timestamp": string;
}

export const WILL_AUTH_MESSAGE_PREFIX = "PassageHack Will Auth";

export function buildWillAuthMessage(address: string, timestamp: number): string {
  return `${WILL_AUTH_MESSAGE_PREFIX}\naddress:${address.toLowerCase()}\ntimestamp:${timestamp}`;
}
