interface AgentForAccess {
  id: string;
  ownerId: string | null;
  isPersonal: boolean;
}

/**
 * Check if a user has access to an agent. Throws if access is denied.
 *
 * Rules:
 * - Admin can access everything
 * - Shared agents (isPersonal=false) are accessible to all authenticated users
 * - Personal agents are only accessible to their owner
 */
export function assertAgentAccess(agent: AgentForAccess, userId: string, userRole: string): void {
  if (userRole === "admin") return;
  if (!agent.isPersonal) return;
  if (agent.ownerId === userId) return;

  throw new Error("Access denied");
}
