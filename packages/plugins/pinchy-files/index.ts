import { readFileSync, readdirSync, statSync, realpathSync } from "fs";
import { join } from "path";
import { validateAccess, MAX_FILE_SIZE, type AgentFileConfig } from "./validate";

interface PluginApi {
  registerTool: (definition: ToolDefinition) => void;
  pluginConfig: {
    agents: Record<string, AgentFileConfig>;
  };
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (
    agentId: string,
    params: Record<string, unknown>
  ) => Promise<unknown>;
}

export default function pinchyFiles(api: PluginApi) {
  const agentConfigs = api.pluginConfig?.agents ?? {};

  function getAllPaths(): string[] {
    const allPaths = new Set<string>();
    for (const config of Object.values(agentConfigs)) {
      for (const p of config.allowed_paths) {
        allPaths.add(p);
      }
    }
    return [...allPaths];
  }

  const allPaths = getAllPaths();
  const pathList = allPaths.join(", ");

  api.registerTool({
    name: "pinchy_ls",
    description: `List files and directories. You have access to: ${pathList}`,
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path to list" },
      },
      required: ["path"],
    },
    async execute(agentId: string, params: Record<string, unknown>) {
      const config = agentConfigs[agentId];
      if (!config) {
        return {
          content: [
            {
              type: "text",
              text: "Access denied: no file access configured",
            },
          ],
          isError: true,
        };
      }

      try {
        const requestedPath = params.path as string;
        const realPath = realpathSync(requestedPath);
        validateAccess(config, realPath);

        const entries = readdirSync(realPath);
        const results = entries
          .filter((name) => !name.startsWith("."))
          .map((name) => {
            const fullPath = join(realPath, name);
            const stats = statSync(fullPath);
            return {
              name,
              type: stats.isDirectory() ? "directory" : "file",
              size: stats.isFile() ? stats.size : undefined,
            };
          });

        return {
          content: [
            { type: "text", text: JSON.stringify(results, null, 2) },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: message }],
          isError: true,
        };
      }
    },
  });

  api.registerTool({
    name: "pinchy_read",
    description: `Read a file's content. You have access to: ${pathList}`,
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
    async execute(agentId: string, params: Record<string, unknown>) {
      const config = agentConfigs[agentId];
      if (!config) {
        return {
          content: [
            {
              type: "text",
              text: "Access denied: no file access configured",
            },
          ],
          isError: true,
        };
      }

      try {
        const requestedPath = params.path as string;
        const realPath = realpathSync(requestedPath);
        validateAccess(config, realPath);

        const stats = statSync(realPath);
        if (stats.size > MAX_FILE_SIZE) {
          return {
            content: [
              {
                type: "text",
                text: `File too large (${stats.size} bytes). Maximum: ${MAX_FILE_SIZE} bytes.`,
              },
            ],
            isError: true,
          };
        }

        const content = readFileSync(realPath, "utf-8");
        return { content: [{ type: "text", text: content }] };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: message }],
          isError: true,
        };
      }
    },
  });
}
