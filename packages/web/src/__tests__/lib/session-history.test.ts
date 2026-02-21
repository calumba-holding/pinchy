import { describe, it, expect, vi, beforeEach } from "vitest";

const { readFileSyncMock } = vi.hoisted(() => ({
  readFileSyncMock: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    default: { ...actual, readFileSync: readFileSyncMock },
    readFileSync: readFileSyncMock,
  };
});

import { readSessionHistory } from "@/lib/session-history";

const SESSION_KEY = "550e8400-e29b-41d4-a716-446655440000";

/** Helper: mock sessions.json with no mapping + JSONL content for sessionKey */
function mockDirectJsonl(jsonl: string) {
  readFileSyncMock.mockImplementation((path: string) => {
    if (path.endsWith("sessions.json")) return "{}";
    if (path.endsWith(`${SESSION_KEY}.jsonl`)) return jsonl;
    throw new Error("ENOENT");
  });
}

describe("readSessionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENCLAW_SESSIONS_PATH;
  });

  it("should parse valid JSONL with user and assistant messages", () => {
    const jsonl = [
      JSON.stringify({
        type: "message",
        id: "msg-1",
        message: { role: "user", content: [{ type: "text", text: "Hello" }] },
      }),
      JSON.stringify({
        type: "message",
        id: "msg-2",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
        },
      }),
    ].join("\n");

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ]);
  });

  it("should extract only text content parts from assistant messages", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: {
        role: "assistant",
        content: [
          { type: "thinking", thinking: "Let me think..." },
          { type: "text", text: "Here is my answer." },
          { type: "toolCall", toolCallId: "tc-1", toolName: "search" },
          { type: "text", text: "And more." },
        ],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "assistant", content: "Here is my answer. And more." }]);
  });

  it("should skip toolResult entries", () => {
    const jsonl = [
      JSON.stringify({
        type: "message",
        id: "msg-1",
        message: { role: "user", content: [{ type: "text", text: "Search for X" }] },
      }),
      JSON.stringify({
        type: "message",
        id: "msg-2",
        message: { role: "toolResult", content: [{ type: "text", text: "result data" }] },
      }),
      JSON.stringify({
        type: "message",
        id: "msg-3",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "I found X." }],
        },
      }),
    ].join("\n");

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([
      { role: "user", content: "Search for X" },
      { role: "assistant", content: "I found X." },
    ]);
  });

  it("should return empty array for missing file", () => {
    readFileSyncMock.mockImplementation((path: string) => {
      if (path.endsWith("sessions.json")) return "{}";
      throw new Error("ENOENT");
    });

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([]);
  });

  it("should return empty array for invalid JSON lines", () => {
    mockDirectJsonl("not valid json\n{also broken");

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([]);
  });

  it("should reject sessionKey with path traversal characters", () => {
    const result = readSessionHistory("../../../etc/passwd");

    expect(result).toEqual([]);
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should reject sessionKey with slashes", () => {
    const result = readSessionHistory("foo/bar");

    expect(result).toEqual([]);
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should resolve internal sessionId from sessions.json", () => {
    const internalId = "aaaabbbb-cccc-dddd-eeee-ffffffffffff";
    const sessionsJson = JSON.stringify({
      [`agent:main:${SESSION_KEY}`]: { sessionId: internalId },
    });
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: { role: "user", content: [{ type: "text", text: "Hello" }] },
    });

    readFileSyncMock.mockImplementation((path: string) => {
      if (path.endsWith("sessions.json")) return sessionsJson;
      if (path.endsWith(`${internalId}.jsonl`)) return jsonl;
      throw new Error("ENOENT");
    });

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("should fall back to sessionKey as filename if not in sessions.json", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: { role: "user", content: [{ type: "text", text: "Hello" }] },
    });

    readFileSyncMock.mockImplementation((path: string) => {
      if (path.endsWith("sessions.json")) return "{}";
      if (path.endsWith(`${SESSION_KEY}.jsonl`)) return jsonl;
      throw new Error("ENOENT");
    });

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("should fall back to sessionKey if sessions.json is missing", () => {
    readFileSyncMock.mockImplementation((path: string) => {
      if (path.endsWith("sessions.json")) throw new Error("ENOENT");
      if (path.endsWith(`${SESSION_KEY}.jsonl`))
        return JSON.stringify({
          type: "message",
          id: "msg-1",
          message: { role: "user", content: [{ type: "text", text: "Hi" }] },
        });
      throw new Error("ENOENT");
    });

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Hi" }]);
  });

  it("should use OPENCLAW_SESSIONS_PATH env var when set", () => {
    process.env.OPENCLAW_SESSIONS_PATH = "/custom/sessions";
    readFileSyncMock.mockImplementation((path: string) => {
      if (path === "/custom/sessions/sessions.json") return "{}";
      if (path === `/custom/sessions/${SESSION_KEY}.jsonl`) return "";
      throw new Error("ENOENT");
    });

    readSessionHistory(SESSION_KEY);

    expect(readFileSyncMock).toHaveBeenCalledWith("/custom/sessions/sessions.json", "utf-8");
  });

  it("should skip empty lines in JSONL", () => {
    const jsonl = [
      JSON.stringify({
        type: "message",
        id: "msg-1",
        message: { role: "user", content: [{ type: "text", text: "Hello" }] },
      }),
      "",
      "",
      JSON.stringify({
        type: "message",
        id: "msg-2",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hi!" }],
        },
      }),
    ].join("\n");

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi!" },
    ]);
  });

  it("should skip non-message type entries", () => {
    const jsonl = [
      JSON.stringify({ type: "system", data: "session started" }),
      JSON.stringify({
        type: "message",
        id: "msg-1",
        message: { role: "user", content: [{ type: "text", text: "Hello" }] },
      }),
    ].join("\n");

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("should skip assistant messages with no text content", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: {
        role: "assistant",
        content: [
          { type: "thinking", thinking: "Hmm..." },
          { type: "toolCall", toolCallId: "tc-1", toolName: "search" },
        ],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([]);
  });

  it("should strip timestamp prefix from user messages", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: {
        role: "user",
        content: [{ type: "text", text: "[Fri 2026-02-20 21:30 UTC] Geht's?" }],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Geht's?", timestamp: undefined }]);
  });

  it("should not strip brackets from assistant messages", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "[Note] This is important." }],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([
      { role: "assistant", content: "[Note] This is important.", timestamp: undefined },
    ]);
  });

  it("should leave user messages without timestamp prefix unchanged", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: {
        role: "user",
        content: [{ type: "text", text: "Hello without prefix" }],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([
      { role: "user", content: "Hello without prefix", timestamp: undefined },
    ]);
  });

  it("should extract timestamp from JSONL entry", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      timestamp: "2026-02-20T21:30:00Z",
      message: {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Hello", timestamp: "2026-02-20T21:30:00Z" }]);
  });

  it("should return undefined timestamp when JSONL entry has no timestamp", () => {
    const jsonl = JSON.stringify({
      type: "message",
      id: "msg-1",
      message: {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
    });

    mockDirectJsonl(jsonl);

    const result = readSessionHistory(SESSION_KEY);

    expect(result).toEqual([{ role: "user", content: "Hello", timestamp: undefined }]);
  });
});
