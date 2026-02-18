import { describe, it, expect, vi } from "vitest";
import { updateAgent } from "@/lib/agents";

vi.mock("@/db", () => {
  const updateMock = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: "1",
          name: "Updated Smithers",
          model: "anthropic/claude-opus-4-6",
          systemPrompt: "You are helpful.",
        }]),
      }),
    }),
  });
  return { db: { update: updateMock } };
});

describe("updateAgent", () => {
  it("should update agent fields", async () => {
    const result = await updateAgent("1", {
      name: "Updated Smithers",
      model: "anthropic/claude-opus-4-6",
      systemPrompt: "You are helpful.",
    });

    expect(result.name).toBe("Updated Smithers");
  });
});
