import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { createMessagePayload, parseOpenClawResponse } from "./src/server/ws";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const OPENCLAW_WS_URL = process.env.OPENCLAW_WS_URL || "ws://localhost:18789";

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url!, true));
  });

  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (clientWs, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const agentId = url.searchParams.get("agentId");

    // Connect to OpenClaw Gateway
    const openclawWs = new WebSocket(OPENCLAW_WS_URL);
    let currentMessageId = crypto.randomUUID();

    openclawWs.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const response = parseOpenClawResponse(parsed);
        clientWs.send(
          JSON.stringify({
            ...response,
            messageId: currentMessageId,
          })
        );
      } catch {
        // Ignore unparseable messages
      }
    });

    clientWs.on("message", (data) => {
      try {
        // New user message = new response messageId
        currentMessageId = crypto.randomUUID();
        const parsed = JSON.parse(data.toString());
        const payload = createMessagePayload(parsed.content, parsed.agentId);
        openclawWs.send(JSON.stringify(payload));
      } catch {
        // Ignore unparseable messages
      }
    });

    openclawWs.on("error", (err) => {
      console.error("OpenClaw connection error:", err.message);
      clientWs.close();
    });

    clientWs.on("error", (err) => {
      console.error("Client WebSocket error:", err.message);
      openclawWs.close();
    });

    clientWs.on("close", () => openclawWs.close());
    openclawWs.on("close", () => clientWs.close());
  });

  const port = parseInt(process.env.PORT || "7777", 10);
  server.listen(port, () => {
    console.log(`Pinchy ready on http://localhost:${port}`);
  });
});
