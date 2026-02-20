import { db } from "@/db";
import { agents } from "@/db/schema";
import { ensureWorkspace } from "@/lib/workspace";
import { getSetting } from "@/lib/settings";
import { PROVIDERS, type ProviderName } from "@/lib/providers";

export async function seedPersonalAgent(userId: string) {
  const defaultProvider = (await getSetting("default_provider")) as ProviderName | null;
  const model = defaultProvider
    ? PROVIDERS[defaultProvider].defaultModel
    : "anthropic/claude-sonnet-4-20250514";

  const [agent] = await db
    .insert(agents)
    .values({
      name: "Smithers",
      model,
      ownerId: userId,
      isPersonal: true,
    })
    .returning();

  ensureWorkspace(agent.id);

  return agent;
}
