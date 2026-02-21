import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createInvite } from "@/lib/invites";

export async function POST(request: NextRequest) {
  const sessionOrError = await requireAdmin();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { email, role } = await request.json();

  if (!role || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Role must be 'admin' or 'user'" }, { status: 400 });
  }

  const invite = await createInvite({ email, role, createdBy: session.user.id });

  return NextResponse.json(invite, { status: 201 });
}
