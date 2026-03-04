import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditLogTable } from "@/components/audit-log-table";

export default async function AuditPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-8">
      <AuditLogTable />
    </div>
  );
}
