/**
 * Wallet signature auth for digital will API requests.
 */

const AUTH_MESSAGE_PREFIX = "PassageHack Will Auth";

export function buildWillAuthMessage(address: string, timestamp: number): string {
  return `${AUTH_MESSAGE_PREFIX}\naddress:${address.toLowerCase()}\ntimestamp:${timestamp}`;
}

export async function signWillAuth(
  address: string,
  signMessage: (args: { message: string }) => Promise<string>
): Promise<{ address: string; signature: string; timestamp: number }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = buildWillAuthMessage(address, timestamp);
  const signature = await signMessage({ message });
  return { address, signature, timestamp };
}

export function willAuthHeaders(auth: {
  address: string;
  signature: string;
  timestamp: number;
}): Record<string, string> {
  return {
    "X-Will-Address": auth.address,
    "X-Will-Signature": auth.signature,
    "X-Will-Timestamp": String(auth.timestamp),
  };
}
