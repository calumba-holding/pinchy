import { db } from "@/db";
import { agents } from "@/db/schema";
import { ensureWorkspace } from "@/lib/workspace";

export async function seedDefaultAgent() {
  const existing = await db.query.agents.findFirst();
  if (existing) return existing;

  const [agent] = await db
    .insert(agents)
    .values({
      name: "Smithers",
      model: "anthropic/claude-sonnet-4-20250514",
    })
    .returning();

  ensureWorkspace(agent.id);

  return agent;
}
