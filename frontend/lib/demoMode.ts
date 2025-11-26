/**
 * Demo Mode utilities
 */

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("demoMode") === "true";
}

export function getContractAddress(productionAddress: string, testnetAddress: string): string {
  return isDemoMode() ? testnetAddress : productionAddress;
}

export function getEffectiveThreshold(threshold: number): number {
  if (!isDemoMode()) return threshold;
  // 100x faster in demo mode
  return Math.floor(threshold / 100);
}

export function formatDemoTime(seconds: number): string {
  const effective = getEffectiveThreshold(seconds);
  const days = Math.floor(effective / 86400);
  const hours = Math.floor((effective % 86400) / 3600);
  const minutes = Math.floor((effective % 3600) / 60);
  
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

