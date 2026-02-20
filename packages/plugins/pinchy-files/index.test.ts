import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRegisterTool = vi.fn();
const mockApi = {
  registerTool: mockRegisterTool,
  pluginConfig: {
    agents: {
      "test-agent": {
        allowed_paths: ["/data/test-docs/"],
      },
    },
  },
};

describe("pinchy-files plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register pinchy_ls and pinchy_read tools", async () => {
    const { default: plugin } = await import("./index");
    plugin(mockApi as any);

    expect(mockRegisterTool).toHaveBeenCalledTimes(2);

    const toolNames = mockRegisterTool.mock.calls.map(
      (call: any[]) => call[0].name
    );
    expect(toolNames).toContain("pinchy_ls");
    expect(toolNames).toContain("pinchy_read");
  });

  it("should include allowed paths in tool descriptions", async () => {
    const { default: plugin } = await import("./index");
    plugin(mockApi as any);

    const lsTool = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0].name === "pinchy_ls"
    );
    expect(lsTool[0].description).toContain("/data/test-docs/");

    const readTool = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0].name === "pinchy_read"
    );
    expect(readTool[0].description).toContain("/data/test-docs/");
  });

  it("pinchy_read should require a path parameter", async () => {
    const { default: plugin } = await import("./index");
    plugin(mockApi as any);

    const readTool = mockRegisterTool.mock.calls.find(
      (call: any[]) => call[0].name === "pinchy_read"
    );
    expect(readTool[0].parameters.properties.path).toBeDefined();
    expect(readTool[0].parameters.required).toContain("path");
  });
});
