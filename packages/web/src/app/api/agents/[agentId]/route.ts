import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateAgent, deleteAgent } from "@/lib/agents";
import { auth } from "@/lib/auth";
import { assertAgentAccess } from "@/lib/agent-access";
import { regenerateOpenClawConfig } from "@/lib/openclaw-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await params;

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    assertAgentAccess(agent, session.user.id!, session.user.role || "user");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await params;

  const existingAgent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });

  if (!existingAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    assertAgentAccess(existingAgent, session.user.id!, session.user.role || "user");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Only admins can change permissions
  if (body.allowedTools !== undefined) {
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can change permissions" }, { status: 403 });
    }
    if (existingAgent.isPersonal) {
      return NextResponse.json(
        { error: "Cannot change permissions for personal agents" },
        { status: 400 }
      );
    }
  }

  // Build update data
  const data: { name?: string; model?: string; allowedTools?: string[]; pluginConfig?: unknown } =
    {};
  if (body.name !== undefined) data.name = body.name;
  if (body.model !== undefined) data.model = body.model;
  if (body.allowedTools !== undefined) data.allowedTools = body.allowedTools;
  if (body.pluginConfig !== undefined) data.pluginConfig = body.pluginConfig;

  const agent = await updateAgent(agentId, data);

  // Regenerate config when permissions change
  if (data.allowedTools !== undefined || data.pluginConfig !== undefined) {
    await regenerateOpenClawConfig();
  }

  return NextResponse.json(agent);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { agentId } = await params;

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    assertAgentAccess(agent, session.user.id!, session.user.role || "user");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (agent.isPersonal) {
    return NextResponse.json({ error: "Personal agents cannot be deleted" }, { status: 400 });
  }

  await deleteAgent(agentId);

  return NextResponse.json({ success: true });
}
