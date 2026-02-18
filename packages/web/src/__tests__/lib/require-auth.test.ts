import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
  authConfig: {},
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

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

import { requireAuth } from "@/lib/require-auth";

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when auth() returns null", async () => {
    mockAuth.mockResolvedValue(null);

    await requireAuth();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when auth() returns an error object", async () => {
    mockAuth.mockResolvedValue({
      message: "There was a problem with the server configuration.",
    });

    await requireAuth();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when session has no user", async () => {
    mockAuth.mockResolvedValue({ expires: "2026-03-01T00:00:00.000Z" });

    await requireAuth();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("returns the session when user is present", async () => {
    const validSession = {
      user: { id: "1", email: "admin@test.com", name: "Admin" },
      expires: "2026-03-01T00:00:00.000Z",
    };
    mockAuth.mockResolvedValue(validSession);

    const result = await requireAuth();

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual(validSession);
  });
});
