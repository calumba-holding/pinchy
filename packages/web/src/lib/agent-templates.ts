export interface AgentTemplate {
  name: string;
  description: string;
  deniedToolGroups: string[];
  pluginId: string | null;
  defaultSoulMd: string;
}

export const AGENT_TEMPLATES: Record<string, AgentTemplate> = {
  "knowledge-base": {
    name: "Knowledge Base",
    description: "Answer questions from your docs",
    deniedToolGroups: ["group:runtime", "group:fs", "group:web"],
    pluginId: "pinchy-files",
    defaultSoulMd: `<!-- Describe your agent's personality here. For example:
You are a helpful knowledge base assistant. You answer questions
based on the documents available to you. Always cite your sources. -->`,
  },
  custom: {
    name: "Custom Agent",
    description: "Start from scratch",
    deniedToolGroups: [],
    pluginId: null,
    defaultSoulMd: `<!-- Describe your agent's personality and instructions here. -->`,
  },
};

export function getTemplate(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES[id];
}
