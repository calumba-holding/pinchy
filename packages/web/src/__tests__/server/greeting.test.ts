import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/settings", () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      agents: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  agents: { isPersonal: "isPersonal" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { shouldTriggerGreeting, markGreetingSent, getGreetingAgentId } from "@/lib/greeting";
import { getSetting, setSetting } from "@/lib/settings";

describe("greeting trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when greeting is pending", async () => {
    vi.mocked(getSetting).mockResolvedValue("true");

    const result = await shouldTriggerGreeting();
    expect(result).toBe(true);
    expect(getSetting).toHaveBeenCalledWith("onboarding_greeting_pending");
  });

  it("should return false when greeting already sent", async () => {
    vi.mocked(getSetting).mockResolvedValue("false");

    const result = await shouldTriggerGreeting();
    expect(result).toBe(false);
  });

  it("should return false when setting not found", async () => {
    vi.mocked(getSetting).mockResolvedValue(null);

    const result = await shouldTriggerGreeting();
    expect(result).toBe(false);
  });

  it("should mark greeting as sent", async () => {
    await markGreetingSent();
    expect(setSetting).toHaveBeenCalledWith("onboarding_greeting_pending", "false", false);
  });
});

describe("getGreetingAgentId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the first personal agent ID", async () => {
    mockFindFirst.mockResolvedValue({ id: "smithers-uuid" });

    const agentId = await getGreetingAgentId();
    expect(agentId).toBe("smithers-uuid");
  });

  it("should return undefined when no personal agent exists", async () => {
    mockFindFirst.mockResolvedValue(null);

    const agentId = await getGreetingAgentId();
    expect(agentId).toBeUndefined();
  });
});
