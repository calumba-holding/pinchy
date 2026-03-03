import { redirect } from "next/navigation";
import { isSetupComplete, isProviderConfigured } from "@/lib/setup";
import { requireAuth } from "@/lib/require-auth";
import { db } from "@/db";
import { activeAgents } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const setupComplete = await isSetupComplete();

  if (!setupComplete) {
    redirect("/setup");
  }

  const session = await requireAuth();

  const providerConfigured = await isProviderConfigured();
  if (!providerConfigured) {
    redirect("/setup/provider");
  }

  const isAdmin = session?.user?.role === "admin";
  const userId = session?.user?.id;

  const visibleAgents = isAdmin
    ? await db.select().from(activeAgents)
    : await db
        .select()
        .from(activeAgents)
        .where(or(eq(activeAgents.isPersonal, false), eq(activeAgents.ownerId, userId!)));

  if (visibleAgents.length > 0) {
    redirect(`/chat/${visibleAgents[0].id}`);
  }

  return <div className="p-8">No agent configured.</div>;
}
