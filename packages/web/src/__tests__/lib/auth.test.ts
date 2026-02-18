import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {},
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: vi.fn(),
}));

import { authConfig } from "@/lib/auth";

describe("auth configuration", () => {
  it("should export auth config", () => {
    expect(authConfig).toBeDefined();
  });

  it("should have credentials provider", () => {
    expect(authConfig.providers).toBeDefined();
    expect(authConfig.providers.length).toBeGreaterThan(0);
  });

  it("should use jwt session strategy", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
  });

  it("should configure custom sign-in page", () => {
    expect(authConfig.pages?.signIn).toBe("/login");
  });
});
