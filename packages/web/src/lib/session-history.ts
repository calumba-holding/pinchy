import { readFileSync } from "fs";
import { join } from "path";

const DEFAULT_SESSIONS_PATH = "/openclaw-config/agents/main/sessions";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface JsonlContentPart {
  type: string;
  text?: string;
}

interface JsonlEntry {
  type: string;
  timestamp?: string;
  message?: {
    role: string;
    content: JsonlContentPart[];
  };
}

interface SessionsJsonEntry {
  sessionId: string;
}

/**
 * Resolve the internal OpenClaw session ID from sessions.json.
 * OpenClaw stores a mapping like:
 *   { "agent:main:<pinchySessionKey>": { "sessionId": "<internalId>" } }
 * The JSONL file is named after the internal ID, not Pinchy's key.
 */
function resolveSessionId(sessionsPath: string, sessionKey: string): string {
  try {
    const raw = readFileSync(join(sessionsPath, "sessions.json"), "utf-8");
    const sessions: Record<string, SessionsJsonEntry> = JSON.parse(raw);
    const entry = sessions[`agent:main:${sessionKey}`];
    if (entry?.sessionId) {
      return entry.sessionId;
    }
  } catch {
    // sessions.json missing or unparseable — fall back to sessionKey
  }
  return sessionKey;
}

export function readSessionHistory(sessionKey: string): SessionMessage[] {
  if (!UUID_REGEX.test(sessionKey)) {
    return [];
  }

  const sessionsPath = process.env.OPENCLAW_SESSIONS_PATH || DEFAULT_SESSIONS_PATH;

  const fileId = resolveSessionId(sessionsPath, sessionKey);
  const filePath = join(sessionsPath, `${fileId}.jsonl`);

  let fileContent: string;
  try {
    fileContent = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const messages: SessionMessage[] = [];

  for (const line of fileContent.split("\n")) {
    if (!line.trim()) continue;

    let entry: JsonlEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.type !== "message" || !entry.message) continue;

    const { role, content } = entry.message;
    if (role !== "user" && role !== "assistant") continue;

    const textParts = content
      .filter((part) => part.type === "text" && part.text)
      .map((part) => part.text!);

    let text = textParts.join(" ");
    if (!text) continue;

    // OpenClaw injects a timestamp prefix like "[Fri 2026-02-20 21:30 UTC] " into user messages
    if (role === "user") {
      text = text.replace(/^\[.*?\]\s*/, "");
    }

    messages.push({
      role: role as "user" | "assistant",
      content: text,
      timestamp: entry.timestamp,
    });
  }

  return messages;
}
