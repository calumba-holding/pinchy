import type { OpenClawClient, ContentPart } from "openclaw-node";
import type { WebSocket } from "ws";
import { readSessionHistory } from "@/lib/session-history";

const WS_OPEN = 1;

interface BrowserMessage {
  type: string;
  content: string | ContentPart[];
  agentId: string;
  sessionKey?: string;
}

export class ClientRouter {
  constructor(private openclawClient: OpenClawClient) {}

  async handleMessage(clientWs: WebSocket, message: BrowserMessage): Promise<void> {
    if (message.type === "history") {
      return this.handleHistory(clientWs, message.sessionKey);
    }

    const messageId = crypto.randomUUID();

    try {
      // Use OpenClaw's "main" agent. Pinchy's internal agent IDs don't map to
      // OpenClaw agent IDs. Future: configurable agent mapping.
      const chatOptions: Record<string, string> = {};
      if (message.sessionKey) {
        chatOptions.sessionKey = message.sessionKey;
      }

      // Gateway only accepts string messages — extract text from ContentPart[]
      const text = Array.isArray(message.content)
        ? message.content
            .filter((part) => part.type === "text" && "text" in part)
            .map((part) => (part as { text: string }).text)
            .join(" ")
        : message.content;

      const stream = this.openclawClient.chat(text, chatOptions);

      for await (const chunk of stream) {
        if (chunk.type === "text") {
          this.sendToClient(clientWs, {
            type: "chunk",
            content: chunk.text,
            messageId,
          });
        }

        if (chunk.type === "done") {
          this.sendToClient(clientWs, {
            type: "done",
            messageId,
          });
        }
      }
    } catch (err) {
      this.sendToClient(clientWs, {
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
        messageId,
      });
    }
  }

  private handleHistory(clientWs: WebSocket, sessionKey?: string): void {
    if (!sessionKey) {
      this.sendToClient(clientWs, { type: "history", messages: [] });
      return;
    }
    const messages = readSessionHistory(sessionKey);
    this.sendToClient(clientWs, { type: "history", messages });
  }

  private sendToClient(ws: WebSocket, data: Record<string, unknown>): void {
    if (ws.readyState === WS_OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}
