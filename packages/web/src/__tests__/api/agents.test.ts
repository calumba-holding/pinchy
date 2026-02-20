import { describe, it, expect, vi } from "vitest";
import { updateAgent } from "@/lib/agents";

vi.mock("@/db", () => {
  const updateMock = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "1",
            name: "Updated Smithers",
            model: "anthropic/claude-opus-4-6",
          },
        ]),
      }),
    }),
  });
  return { db: { update: updateMock } };
});

vi.mock("@/lib/openclaw-config", () => ({
  regenerateOpenClawConfig: vi.fn().mockResolvedValue(undefined),
}));

describe("updateAgent", () => {
  it("should update agent fields and return updated agent", async () => {
    const result = await updateAgent("1", {
      name: "Updated Smithers",
      model: "anthropic/claude-opus-4-6",
    });

    expect(result.name).toBe("Updated Smithers");
    expect(result.model).toBe("anthropic/claude-opus-4-6");
  });

  it("should call regenerateOpenClawConfig after update", async () => {
    const { regenerateOpenClawConfig } = await import("@/lib/openclaw-config");

    await updateAgent("1", {
      name: "Updated Smithers",
    });

    expect(regenerateOpenClawConfig).toHaveBeenCalled();
  });
});
