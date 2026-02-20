import { db } from "@/db";
import { agents } from "@/db/schema";
import { ensureWorkspace } from "@/lib/workspace";

export async function seedDefaultAgent(ownerId?: string) {
  const existing = await db.query.agents.findFirst();
  if (existing) return existing;

  const [agent] = await db
    .insert(agents)
    .values({
      name: "Smithers",
      model: "anthropic/claude-sonnet-4-20250514",
      ownerId: ownerId ?? null,
      isPersonal: ownerId ? true : false,
    })
    .returning();

  ensureWorkspace(agent.id);

  return agent;
}
