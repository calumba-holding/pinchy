import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

interface UpdateAgentInput {
  name?: string;
  model?: string;
  systemPrompt?: string | null;
}

export async function updateAgent(id: string, data: UpdateAgentInput) {
  const [updated] = await db.update(agents).set(data).where(eq(agents.id, id)).returning();

  return updated;
}
