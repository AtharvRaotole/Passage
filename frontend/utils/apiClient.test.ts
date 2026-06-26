import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildExecutionWebSocketUrl,
  getBackendWsHost,
  getAuthHeaders,
} from "./apiClient";

describe("apiClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("getAuthHeaders includes Bearer token when API key is set", () => {
    process.env.NEXT_PUBLIC_API_KEY = "secret-key";
    const headers = getAuthHeaders();
    expect(headers.Authorization).toBe("Bearer secret-key");
  });

  it("getBackendWsHost uses NEXT_PUBLIC_WS_HOST when set", () => {
    process.env.NEXT_PUBLIC_WS_HOST = "backend.example.com:8000";
    expect(getBackendWsHost()).toBe("backend.example.com:8000");
  });

  it("getBackendWsHost derives host from backend URL", () => {
    delete process.env.NEXT_PUBLIC_WS_HOST;
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000";
    expect(getBackendWsHost()).toBe("localhost:8000");
  });

  it("buildExecutionWebSocketUrl points to backend host", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000";
    delete process.env.NEXT_PUBLIC_WS_HOST;
    const url = buildExecutionWebSocketUrl("exec-abc");
    expect(url).toBe("ws://localhost:8000/ws/execution/exec-abc");
  });
});
