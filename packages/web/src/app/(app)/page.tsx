import { db } from "@/db";
import { agents } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const allAgents = await db.select().from(agents);

  if (allAgents.length > 0) {
    redirect(`/chat/${allAgents[0].id}`);
  }

  return <div className="p-8">No agent configured.</div>;
}
