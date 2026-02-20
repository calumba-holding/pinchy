import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createInvite } from "@/lib/invites";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role } = await request.json();

  if (!role || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Role must be 'admin' or 'user'" }, { status: 400 });
  }

  const invite = await createInvite({ email, role, createdBy: session.user.id });

  return NextResponse.json(invite, { status: 201 });
}
