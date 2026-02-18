import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/setup";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agents } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const setupComplete = await isSetupComplete();

  if (!setupComplete) {
    redirect("/setup");
  }

  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const allAgents = await db.select().from(agents);

  if (allAgents.length > 0) {
    redirect(`/chat/${allAgents[0].id}`);
  }

  return <div className="p-8">No agent configured.</div>;
}
