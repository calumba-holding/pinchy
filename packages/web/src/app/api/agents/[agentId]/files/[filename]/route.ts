import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readWorkspaceFile, writeWorkspaceFile } from "@/lib/workspace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; filename: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, filename } = await params;

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    const content = readWorkspaceFile(agentId, filename);
    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; filename: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, filename } = await params;

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { content } = await request.json();

  try {
    writeWorkspaceFile(agentId, filename, content);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
