import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const setupCompleted = await isSetupComplete();

  if (setupCompleted) {
    redirect("/");
  }

  return children;
}
