import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "1", email: "admin@test.com" } }),
}));

vi.mock("fs", () => {
  const mocks = {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  };
  return { ...mocks, default: mocks };
});

import { existsSync, readdirSync, statSync } from "fs";
import { GET } from "@/app/api/data-directories/route";

describe("GET /api/data-directories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return directories under /data/", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(["documents", "hr-docs", ".hidden"] as any);
    vi.mocked(statSync)
      .mockReturnValueOnce({ isDirectory: () => true } as any)
      .mockReturnValueOnce({ isDirectory: () => true } as any)
      .mockReturnValueOnce({ isDirectory: () => true } as any);

    const response = await GET();
    const body = await response.json();

    expect(body.directories).toEqual([
      { path: "/data/documents", name: "documents" },
      { path: "/data/hr-docs", name: "hr-docs" },
    ]);
    expect(body.directories).toHaveLength(2);
  });

  it("should return empty array when /data/ does not exist", async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const response = await GET();
    const body = await response.json();

    expect(body.directories).toEqual([]);
  });

  it("should return 401 without auth", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
