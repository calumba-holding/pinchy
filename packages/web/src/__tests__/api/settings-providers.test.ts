import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/settings/providers/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "1", email: "admin@test.com" } }),
}));

vi.mock("@/lib/providers", () => ({
  PROVIDERS: {
    anthropic: {
      name: "Anthropic",
      settingsKey: "anthropic_api_key",
      envVar: "ANTHROPIC_API_KEY",
      defaultModel: "anthropic/claude-haiku-4-5-20251001",
      placeholder: "sk-ant-...",
    },
    openai: {
      name: "OpenAI",
      settingsKey: "openai_api_key",
      envVar: "OPENAI_API_KEY",
      defaultModel: "openai/gpt-4o-mini",
      placeholder: "sk-...",
    },
    google: {
      name: "Google",
      settingsKey: "google_api_key",
      envVar: "GOOGLE_API_KEY",
      defaultModel: "google/gemini-2.0-flash",
      placeholder: "AIza...",
    },
  },
}));

vi.mock("@/lib/settings", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
}));

import { auth } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

describe("GET /api/settings/providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSetting).mockResolvedValue(null);
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return all providers as not configured when nothing is set", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      defaultProvider: null,
      providers: {
        anthropic: { configured: false },
        openai: { configured: false },
        google: { configured: false },
      },
    });
  });

  it("should return configured: true for a provider with a stored key", async () => {
    vi.mocked(getSetting).mockImplementation(async (key: string) => {
      if (key === "anthropic_api_key") return "sk-ant-secret-key-xY9z";
      return null;
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.providers.anthropic.configured).toBe(true);
    expect(data.providers.openai.configured).toBe(false);
    expect(data.providers.google.configured).toBe(false);
  });

  it("should return hint with last 4 characters of the key", async () => {
    vi.mocked(getSetting).mockImplementation(async (key: string) => {
      if (key === "anthropic_api_key") return "sk-ant-secret-key-xY9z";
      return null;
    });

    const response = await GET();
    const data = await response.json();

    expect(data.providers.anthropic.hint).toBe("xY9z");
    expect(data.providers.openai.hint).toBeUndefined();
    expect(data.providers.google.hint).toBeUndefined();
  });

  it("should return correct defaultProvider value", async () => {
    vi.mocked(getSetting).mockImplementation(async (key: string) => {
      if (key === "default_provider") return "anthropic";
      if (key === "anthropic_api_key") return "sk-ant-secret";
      return null;
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.defaultProvider).toBe("anthropic");
  });
});
