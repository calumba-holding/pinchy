import { describe, it, expect } from "vitest";
import { createMessagePayload, parseOpenClawResponse } from "@/server/ws";

describe("WebSocket message bridge", () => {
  it("should create a valid message payload for OpenClaw", () => {
    const payload = createMessagePayload("Hello", "agent-1");
    expect(payload).toHaveProperty("content", "Hello");
    expect(payload).toHaveProperty("agentId", "agent-1");
  });

  it("should parse OpenClaw response chunks", () => {
    const chunk = { type: "text", text: "Hello back!" };
    const result = parseOpenClawResponse(chunk);
    expect(result).toEqual({
      type: "chunk",
      content: "Hello back!",
    });
  });
});
