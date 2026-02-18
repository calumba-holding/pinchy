import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const allAgents = await db.select().from(agents);

  return (
    <div className="flex h-screen">
      <Sidebar agents={allAgents} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
