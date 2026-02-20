import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @/db ────────────────────────────────────────────────────────────────
const findFirstMock = vi.fn();
const returningMock = vi.fn();
const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

vi.mock("@/db", () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
    query: {
      agents: {
        findFirst: (...args: unknown[]) => findFirstMock(...args),
      },
    },
  },
}));

// ── Mock @/lib/workspace ─────────────────────────────────────────────────────
vi.mock("@/lib/workspace", () => ({
  ensureWorkspace: vi.fn(),
  writeWorkspaceFile: vi.fn(),
}));

// ── Mock @/lib/smithers-soul ────────────────────────────────────────────────
vi.mock("@/lib/smithers-soul", () => ({
  SMITHERS_SOUL_MD: "# Smithers\n\nTest soul content",
}));

import { ensureWorkspace, writeWorkspaceFile } from "@/lib/workspace";

describe("seedDefaultAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing agent if one exists", async () => {
    const existingAgent = { id: "existing-1", name: "Smithers" };
    findFirstMock.mockResolvedValue(existingAgent);

    const { seedDefaultAgent } = await import("@/db/seed");
    const agent = await seedDefaultAgent();

    expect(agent).toEqual(existingAgent);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("creates a new agent when none exists", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const fakeAgent = {
      id: "agent-new",
      name: "Smithers",
      model: "anthropic/claude-sonnet-4-20250514",
      ownerId: null,
      isPersonal: false,
      createdAt: new Date(),
    };
    returningMock.mockResolvedValue([fakeAgent]);

    const { seedDefaultAgent } = await import("@/db/seed");
    const agent = await seedDefaultAgent();

    expect(agent.name).toBe("Smithers");
    expect(ensureWorkspace).toHaveBeenCalledWith("agent-new");
  });

  it("writes Smithers SOUL.md to the workspace", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const fakeAgent = {
      id: "agent-soul-test",
      name: "Smithers",
      model: "anthropic/claude-sonnet-4-20250514",
      ownerId: null,
      isPersonal: false,
      createdAt: new Date(),
    };
    returningMock.mockResolvedValue([fakeAgent]);

    const { seedDefaultAgent } = await import("@/db/seed");
    await seedDefaultAgent();

    expect(writeWorkspaceFile).toHaveBeenCalledWith(
      "agent-soul-test",
      "SOUL.md",
      "# Smithers\n\nTest soul content"
    );
  });

  it("does not write SOUL.md when agent already exists", async () => {
    const existingAgent = { id: "existing-1", name: "Smithers" };
    findFirstMock.mockResolvedValue(existingAgent);

    const { seedDefaultAgent } = await import("@/db/seed");
    await seedDefaultAgent();

    expect(writeWorkspaceFile).not.toHaveBeenCalled();
  });
});
