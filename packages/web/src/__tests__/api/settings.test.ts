import { describe, it, expect, vi } from "vitest";
import { getSetting, setSetting } from "@/lib/settings";

vi.mock("@/db", () => {
  return {
    db: {
      query: {
        settings: {
          findFirst: vi.fn().mockResolvedValue(undefined),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    },
  };
});

describe("settings", () => {
  it("should return null for missing setting", async () => {
    const result = await getSetting("nonexistent");
    expect(result).toBeNull();
  });
});
