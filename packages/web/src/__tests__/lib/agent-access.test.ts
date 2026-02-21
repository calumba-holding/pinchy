import { describe, it, expect } from "vitest";
import { assertAgentAccess } from "@/lib/agent-access";

describe("assertAgentAccess", () => {
  it("allows admin access to any agent", () => {
    const agent = { id: "a1", ownerId: "other-user", isPersonal: false };
    expect(() => assertAgentAccess(agent, "admin-user", "admin")).not.toThrow();
  });

  it("allows any user to access shared (non-personal) agents", () => {
    const agent = { id: "a1", ownerId: null, isPersonal: false };
    expect(() => assertAgentAccess(agent, "any-user", "user")).not.toThrow();
  });

  it("allows owner to access their personal agent", () => {
    const agent = { id: "a1", ownerId: "user-1", isPersonal: true };
    expect(() => assertAgentAccess(agent, "user-1", "user")).not.toThrow();
  });

  it("denies non-owner access to personal agent", () => {
    const agent = { id: "a1", ownerId: "user-1", isPersonal: true };
    expect(() => assertAgentAccess(agent, "other-user", "user")).toThrow("Access denied");
  });

  it("allows admin access to personal agent of another user", () => {
    const agent = { id: "a1", ownerId: "user-1", isPersonal: true };
    expect(() => assertAgentAccess(agent, "admin-user", "admin")).not.toThrow();
  });
});
