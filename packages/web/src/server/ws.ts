export function createMessagePayload(content: string, agentId: string) {
  return {
    content,
    agentId,
  };
}

export function parseOpenClawResponse(chunk: { type: string; text?: string }) {
  return {
    type: "chunk" as const,
    content: chunk.text || "",
  };
}
