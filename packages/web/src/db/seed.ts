import { db } from "@/db";
import { agents } from "@/db/schema";
import { ensureWorkspace, writeWorkspaceFile } from "@/lib/workspace";
import { SMITHERS_SOUL_MD } from "@/lib/smithers-soul";

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
  writeWorkspaceFile(agent.id, "SOUL.md", SMITHERS_SOUL_MD);

  return agent;
}
