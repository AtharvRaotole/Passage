import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("GET /api/wallet-pass", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.APPLE_PASS_TYPE_IDENTIFIER;
    delete process.env.APPLE_TEAM_IDENTIFIER;
    delete process.env.APPLE_WWDR_CERT_PEM;
    delete process.env.APPLE_PASS_CERT_PEM;
    delete process.env.APPLE_PASS_KEY_PEM;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns 401 without authorization header", async () => {
    const request = new NextRequest("http://localhost:3000/api/wallet-pass");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 503 when Apple pass certs are not configured", async () => {
    const request = new NextRequest("http://localhost:3000/api/wallet-pass", {
      headers: { Authorization: "Bearer test-token" },
    });
    const response = await GET(request);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("wallet_pass_not_configured");
    expect(body.pulseUrl).toBe("http://localhost:3000/pulse");
  });

  it("returns 401 when backend profile fetch fails", async () => {
    process.env.APPLE_PASS_TYPE_IDENTIFIER = "pass.com.passage.checkin";
    process.env.APPLE_TEAM_IDENTIFIER = "TEAM123";
    process.env.APPLE_WWDR_CERT_PEM = "-----BEGIN CERTIFICATE-----\\nWWDR\\n-----END CERTIFICATE-----";
    process.env.APPLE_PASS_CERT_PEM = "-----BEGIN CERTIFICATE-----\\nCERT\\n-----END CERTIFICATE-----";
    process.env.APPLE_PASS_KEY_PEM = "-----BEGIN PRIVATE KEY-----\\nKEY\\n-----END PRIVATE KEY-----";

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as typeof fetch;

    const request = new NextRequest("http://localhost:3000/api/wallet-pass", {
      headers: { Authorization: "Bearer test-token" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
