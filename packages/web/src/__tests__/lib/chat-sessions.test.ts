import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @/db ────────────────────────────────────────────────────────────────
const findFirstMock = vi.fn();
const returningMock = vi.fn();
const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
const setMock = vi.fn().mockReturnValue({ where: vi.fn() });
const updateMock = vi.fn().mockReturnValue({ set: setMock });

vi.mock("@/db", () => ({
  db: {
    query: {
      chatSessions: {
        findFirst: (...args: unknown[]) => findFirstMock(...args),
      },
    },
    insert: (...args: unknown[]) => insertMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  chatSessions: {
    id: "id",
    userId: "user_id",
    agentId: "agent_id",
    createdAt: "created_at",
    runtimeActivated: "runtime_activated",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, type: "eq" })),
  and: vi.fn((...args: unknown[]) => ({ args, type: "and" })),
  desc: vi.fn((col) => ({ col, type: "desc" })),
}));

import { getOrCreateSession, markSessionActivated } from "@/lib/chat-sessions";

describe("getOrCreateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing session if one exists for user+agent", async () => {
    const existing = {
      id: "s1",
      sessionKey: "key-123",
      userId: "u1",
      agentId: "a1",
      runtimeActivated: false,
    };
    findFirstMock.mockResolvedValue(existing);

    const result = await getOrCreateSession("u1", "a1");

    expect(result).toEqual(existing);
    expect(result.sessionKey).toBe("key-123");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("does not insert when an existing session is found", async () => {
    const existing = {
      id: "s1",
      sessionKey: "key-456",
      userId: "u1",
      agentId: "a1",
      runtimeActivated: false,
    };
    findFirstMock.mockResolvedValue(existing);

    await getOrCreateSession("u1", "a1");

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("creates a new session if none exists", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const newSession = {
      id: "s2",
      sessionKey: "new-key",
      userId: "u1",
      agentId: "a1",
      runtimeActivated: false,
    };
    returningMock.mockResolvedValue([newSession]);

    const result = await getOrCreateSession("u1", "a1");

    expect(result).toEqual(newSession);
    expect(result.sessionKey).toBe("new-key");
    expect(insertMock).toHaveBeenCalled();
  });

  it("inserts with correct userId and agentId", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const newSession = {
      id: "s3",
      sessionKey: "key-789",
      userId: "user-42",
      agentId: "agent-7",
      runtimeActivated: false,
    };
    returningMock.mockResolvedValue([newSession]);

    await getOrCreateSession("user-42", "agent-7");

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-42",
        agentId: "agent-7",
      })
    );
  });

  it("generates a sessionKey as a UUID when creating", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const newSession = {
      id: "s4",
      sessionKey: "generated-uuid",
      userId: "u1",
      agentId: "a1",
      runtimeActivated: false,
    };
    returningMock.mockResolvedValue([newSession]);

    await getOrCreateSession("u1", "a1");

    const passedValues = valuesMock.mock.calls[0][0];
    // sessionKey should be a valid UUID v4 format
    expect(passedValues.sessionKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("returns runtimeActivated from existing session", async () => {
    const existing = {
      id: "s1",
      sessionKey: "key-123",
      userId: "u1",
      agentId: "a1",
      runtimeActivated: true,
    };
    findFirstMock.mockResolvedValue(existing);

    const result = await getOrCreateSession("u1", "a1");

    expect(result.runtimeActivated).toBe(true);
  });

  it("returns runtimeActivated=false for new sessions", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const newSession = {
      id: "s6",
      sessionKey: "new-key",
      userId: "u1",
      agentId: "a1",
      runtimeActivated: false,
    };
    returningMock.mockResolvedValue([newSession]);

    const result = await getOrCreateSession("u1", "a1");

    expect(result.runtimeActivated).toBe(false);
  });

  it("queries with correct user and agent filters", async () => {
    findFirstMock.mockResolvedValue(undefined);
    returningMock.mockResolvedValue([
      { id: "s5", sessionKey: "k", userId: "u1", agentId: "a1", runtimeActivated: false },
    ]);

    await getOrCreateSession("u1", "a1");

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        orderBy: expect.any(Object),
      })
    );
  });
});

describe("markSessionActivated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates runtimeActivated to true for the given session", async () => {
    const whereMock = vi.fn();
    setMock.mockReturnValue({ where: whereMock });

    await markSessionActivated("session-123");

    expect(updateMock).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith({ runtimeActivated: true });
    expect(whereMock).toHaveBeenCalled();
  });
});
