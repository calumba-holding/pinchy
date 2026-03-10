import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVisibleAgents } from "@/lib/visible-agents";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/db/schema", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/schema")>();
  return {
    ...actual,
    activeAgents: actual.activeAgents,
  };
});

vi.mock("@/lib/groups", () => ({
  getUserGroupIds: vi.fn(),
  getAgentGroupIds: vi.fn(),
  getAllAgentGroupIds: vi.fn(),
}));

import { db } from "@/db";
import { getUserGroupIds, getAgentGroupIds, getAllAgentGroupIds } from "@/lib/groups";

function mockSelectChain(resolvedValue: unknown) {
  vi.mocked(db.select).mockReturnValueOnce({
    from: vi.fn().mockResolvedValue(resolvedValue),
  } as never);
}

const sharedAgentAll = {
  id: "shared-all",
  ownerId: null,
  isPersonal: false,
  visibility: "all",
};
const sharedAgentRestricted = {
  id: "shared-restricted",
  ownerId: null,
  isPersonal: false,
  visibility: "restricted",
};
const personalAgentOwned = {
  id: "personal-mine",
  ownerId: "user-1",
  isPersonal: true,
  visibility: "all",
};
const personalAgentOther = {
  id: "personal-other",
  ownerId: "other-user",
  isPersonal: true,
  visibility: "all",
};

const allAgents = [sharedAgentAll, sharedAgentRestricted, personalAgentOwned, personalAgentOther];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getVisibleAgents", () => {
  it("admin sees all agents", async () => {
    mockSelectChain(allAgents);

    const result = await getVisibleAgents("admin-user", "admin");

    expect(result).toEqual(allAgents);
  });

  it("member sees agents with visibility 'all'", async () => {
    vi.mocked(getUserGroupIds).mockResolvedValue([]);
    vi.mocked(getAllAgentGroupIds).mockResolvedValue(new Map());
    mockSelectChain(allAgents);

    const result = await getVisibleAgents("user-1", "member");

    expect(result).toContainEqual(sharedAgentAll);
  });

  it("member sees 'restricted' agents when in matching group", async () => {
    vi.mocked(getUserGroupIds).mockResolvedValue(["g1", "g2"]);
    vi.mocked(getAllAgentGroupIds).mockResolvedValue(
      new Map([["shared-restricted", ["g2", "g3"]]])
    );
    mockSelectChain(allAgents);

    const result = await getVisibleAgents("user-1", "member");

    expect(result).toContainEqual(sharedAgentRestricted);
  });

  it("member does NOT see 'restricted' agents when not in matching group", async () => {
    vi.mocked(getUserGroupIds).mockResolvedValue(["g1"]);
    vi.mocked(getAllAgentGroupIds).mockResolvedValue(new Map([["shared-restricted", ["g2"]]]));
    mockSelectChain(allAgents);

    const result = await getVisibleAgents("user-1", "member");

    expect(result).not.toContainEqual(sharedAgentRestricted);
  });

  it("member sees own personal agents", async () => {
    vi.mocked(getUserGroupIds).mockResolvedValue([]);
    vi.mocked(getAllAgentGroupIds).mockResolvedValue(new Map());
    mockSelectChain(allAgents);

    const result = await getVisibleAgents("user-1", "member");

    expect(result).toContainEqual(personalAgentOwned);
  });

  it("member does NOT see other users' personal agents", async () => {
    vi.mocked(getUserGroupIds).mockResolvedValue([]);
    vi.mocked(getAllAgentGroupIds).mockResolvedValue(new Map());
    mockSelectChain(allAgents);

    const result = await getVisibleAgents("user-1", "member");

    expect(result).not.toContainEqual(personalAgentOther);
  });

  it("uses batch query instead of per-agent queries", async () => {
    vi.mocked(getUserGroupIds).mockResolvedValue(["g1"]);
    vi.mocked(getAllAgentGroupIds).mockResolvedValue(new Map());
    mockSelectChain(allAgents);

    await getVisibleAgents("user-1", "member");

    expect(getAllAgentGroupIds).toHaveBeenCalledTimes(1);
    expect(getAgentGroupIds).not.toHaveBeenCalled();
  });
});
