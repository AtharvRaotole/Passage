import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getApplePassConfig, isWalletPassConfigured } from "@/lib/walletPass";

describe("wallet pass configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.APPLE_PASS_TYPE_IDENTIFIER;
    delete process.env.APPLE_TEAM_IDENTIFIER;
    delete process.env.APPLE_WWDR_CERT_PEM;
    delete process.env.APPLE_PASS_CERT_PEM;
    delete process.env.APPLE_PASS_KEY_PEM;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null config when certs are missing", () => {
    expect(getApplePassConfig()).toBeNull();
    expect(isWalletPassConfigured()).toBe(false);
  });

  it("returns config when required env vars are set", () => {
    process.env.APPLE_PASS_TYPE_IDENTIFIER = "pass.com.passage.checkin";
    process.env.APPLE_TEAM_IDENTIFIER = "TEAM123";
    process.env.APPLE_WWDR_CERT_PEM = "-----BEGIN CERTIFICATE-----\\nWWDR\\n-----END CERTIFICATE-----";
    process.env.APPLE_PASS_CERT_PEM = "-----BEGIN CERTIFICATE-----\\nCERT\\n-----END CERTIFICATE-----";
    process.env.APPLE_PASS_KEY_PEM = "-----BEGIN PRIVATE KEY-----\\nKEY\\n-----END PRIVATE KEY-----";

    const config = getApplePassConfig();
    expect(config).not.toBeNull();
    expect(config?.passTypeIdentifier).toBe("pass.com.passage.checkin");
    expect(config?.teamIdentifier).toBe("TEAM123");
    expect(isWalletPassConfigured()).toBe(true);
  });
});
