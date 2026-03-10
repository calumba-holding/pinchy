import { db } from "@/db";
import { activeAgents } from "@/db/schema";
import { getUserGroupIds, getAllAgentGroupIds } from "@/lib/groups";

export async function getVisibleAgents(userId: string, userRole: string) {
  if (userRole === "admin") {
    return db.select().from(activeAgents);
  }

  const [userGroupIds, allAgents, agentGroupMap] = await Promise.all([
    getUserGroupIds(userId),
    db.select().from(activeAgents),
    getAllAgentGroupIds(),
  ]);

  const visible: typeof allAgents = [];
  for (const agent of allAgents) {
    if (agent.isPersonal) {
      if (agent.ownerId === userId) visible.push(agent);
      continue;
    }
    switch (agent.visibility) {
      case "all":
        visible.push(agent);
        break;
      case "restricted": {
        const agentGroupIds = agentGroupMap.get(agent.id) || [];
        if (userGroupIds.some((gId) => agentGroupIds.includes(gId))) {
          visible.push(agent);
        }
        break;
      }
      // unknown visibility — skip (admins-only by default)
    }
  }
  return visible;
}
