import { describe, expect, it } from "vitest";
import { UserStatus } from "@/lib/contracts";
import {
  computeRelevantDate,
  getPulseStatusInfo,
  parseUserInfo,
  thresholdToDays,
} from "@/lib/pulseUtils";

describe("parseUserInfo", () => {
  it("parses contract tuple into status, lastSeen, threshold", () => {
    const result = parseUserInfo([UserStatus.ALIVE, 1700000000, 2592000]);
    expect(result.status).toBe(UserStatus.ALIVE);
    expect(result.lastSeen).toBe(1700000000 * 1000);
    expect(result.threshold).toBe(2592000);
  });

  it("returns nulls for undefined input", () => {
    const result = parseUserInfo(undefined);
    expect(result.status).toBeNull();
    expect(result.lastSeen).toBeNull();
    expect(result.threshold).toBeNull();
  });
});

describe("thresholdToDays", () => {
  it("converts seconds to whole days", () => {
    expect(thresholdToDays(2592000)).toBe(30);
    expect(thresholdToDays(86400)).toBe(1);
  });

  it("returns null for falsy threshold", () => {
    expect(thresholdToDays(null)).toBeNull();
    expect(thresholdToDays(0)).toBeNull();
  });
});

describe("getPulseStatusInfo", () => {
  it("maps ALIVE status", () => {
    const info = getPulseStatusInfo(UserStatus.ALIVE);
    expect(info.text).toBe("Active");
    expect(info.color).toContain("emerald");
  });

  it("maps unknown status to Not Registered", () => {
    const info = getPulseStatusInfo(null);
    expect(info.text).toBe("Not Registered");
  });
});

describe("computeRelevantDate", () => {
  it("returns ISO date when lastSeen and threshold exist", () => {
    const lastSeen = Date.parse("2024-01-01T00:00:00.000Z");
    const result = computeRelevantDate(lastSeen, 86400);
    expect(result).toBe("2024-01-02T00:00:00.000Z");
  });

  it("returns undefined when inputs missing", () => {
    expect(computeRelevantDate(null, 86400)).toBeUndefined();
    expect(computeRelevantDate(Date.now(), null)).toBeUndefined();
  });
});
