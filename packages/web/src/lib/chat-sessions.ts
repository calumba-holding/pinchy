import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface ChatSession {
  id: string;
  sessionKey: string;
  userId: string;
  agentId: string;
}

/**
 * Get the most recent chat session for a user+agent pair, or create a new one.
 * The session key is used internally for OpenClaw — it never leaves the server.
 */
export async function getOrCreateSession(userId: string, agentId: string): Promise<ChatSession> {
  const existing = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.userId, userId), eq(chatSessions.agentId, agentId)),
    orderBy: desc(chatSessions.createdAt),
  });

  if (existing) return existing;

  const [session] = await db
    .insert(chatSessions)
    .values({
      sessionKey: crypto.randomUUID(),
      userId,
      agentId,
    })
    .returning();

  return session;
}
