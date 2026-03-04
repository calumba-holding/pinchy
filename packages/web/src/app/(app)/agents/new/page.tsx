import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewAgentForm } from "@/components/new-agent-form";

export default async function NewAgentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  return <NewAgentForm />;
}
