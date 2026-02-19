import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const writeFileSyncMock = vi.fn();
  const existsSyncMock = vi.fn().mockReturnValue(true);
  const mkdirSyncMock = vi.fn();
  return {
    ...actual,
    default: {
      ...actual,
      writeFileSync: writeFileSyncMock,
      existsSync: existsSyncMock,
      mkdirSync: mkdirSyncMock,
    },
    writeFileSync: writeFileSyncMock,
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
  };
});

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { writeOpenClawConfig } from "@/lib/openclaw-config";

const mockedWriteFileSync = vi.mocked(writeFileSync);
const mockedExistsSync = vi.mocked(existsSync);
const mockedMkdirSync = vi.mocked(mkdirSync);

describe("writeOpenClawConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedExistsSync.mockReturnValue(true);
  });

  it("should write config with Anthropic provider", () => {
    writeOpenClawConfig({
      provider: "anthropic",
      apiKey: "sk-ant-secret",
      model: "anthropic/claude-haiku-4-5-20251001",
    });

    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("openclaw.json"),
      expect.stringContaining('"ANTHROPIC_API_KEY": "sk-ant-secret"'),
      "utf-8"
    );
  });

  it("should write config with correct model", () => {
    writeOpenClawConfig({
      provider: "openai",
      apiKey: "sk-key",
      model: "openai/gpt-4o-mini",
    });

    const written = mockedWriteFileSync.mock.calls[0][1] as string;
    const config = JSON.parse(written);

    expect(config.agents.defaults.model.primary).toBe("openai/gpt-4o-mini");
    expect(config.env.OPENAI_API_KEY).toBe("sk-key");
  });

  it("should include gateway mode local", () => {
    writeOpenClawConfig({
      provider: "anthropic",
      apiKey: "sk-ant-key",
      model: "anthropic/claude-haiku-4-5-20251001",
    });

    const written = mockedWriteFileSync.mock.calls[0][1] as string;
    const config = JSON.parse(written);

    expect(config.gateway.mode).toBe("local");
  });

  it("should create directory if it does not exist", () => {
    mockedExistsSync.mockReturnValue(false);

    writeOpenClawConfig({
      provider: "anthropic",
      apiKey: "sk-ant-key",
      model: "anthropic/claude-haiku-4-5-20251001",
    });

    expect(mockedMkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("should write config with Google provider", () => {
    writeOpenClawConfig({
      provider: "google",
      apiKey: "AIza-key",
      model: "google/gemini-2.0-flash",
    });

    const written = mockedWriteFileSync.mock.calls[0][1] as string;
    const config = JSON.parse(written);

    expect(config.env.GOOGLE_API_KEY).toBe("AIza-key");
    expect(config.agents.defaults.model.primary).toBe("google/gemini-2.0-flash");
  });
});
