import { getSetting, setSetting } from "@/lib/settings";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function shouldTriggerGreeting(): Promise<boolean> {
  const pending = await getSetting("onboarding_greeting_pending");
  return pending === "true";
}

export async function markGreetingSent(): Promise<void> {
  await setSetting("onboarding_greeting_pending", "false", false);
}

export async function getGreetingAgentId(): Promise<string | undefined> {
  const agent = await db.query.agents.findFirst({
    where: eq(agents.isPersonal, true),
  });
  return agent?.id;
}
