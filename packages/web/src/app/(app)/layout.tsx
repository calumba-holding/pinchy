import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { isSetupComplete } from "@/lib/setup";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setupComplete = await isSetupComplete();
  if (!setupComplete) redirect("/setup");

  await requireAuth();

  const allAgents = await db.select().from(agents);

  return (
    <SidebarProvider>
      <AppSidebar agents={allAgents} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
