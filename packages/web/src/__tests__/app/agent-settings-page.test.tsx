import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AgentSettingsPage from "@/app/(app)/chat/[agentId]/settings/page";

vi.mock("@/components/agent-settings-general", () => ({
  AgentSettingsGeneral: () => <div data-testid="general-tab">General</div>,
}));

vi.mock("@/components/agent-settings-personality", () => ({
  AgentSettingsPersonality: () => <div data-testid="personality-tab">Personality</div>,
}));

vi.mock("@/components/agent-settings-file", () => ({
  AgentSettingsFile: () => <div data-testid="file-tab">File</div>,
}));

vi.mock("@/components/agent-settings-permissions", () => ({
  AgentSettingsPermissions: () => <div data-testid="permissions-tab">Permissions</div>,
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn().mockReturnValue({ agentId: "agent-1" }),
  useRouter: vi.fn().mockReturnValue({ refresh: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn().mockReturnValue({
    data: { user: { id: "1", email: "admin@test.com", role: "admin" } },
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props}>{children}</a>
  ),
}));

const agentData = {
  id: "agent-1",
  name: "Test Agent",
  model: "anthropic/claude-sonnet-4-20250514",
  isPersonal: false,
  allowedTools: [],
  pluginConfig: null,
  tagline: "A test agent",
  avatarSeed: "seed-1",
  personalityPresetId: "the-butler",
};

function mockFetchResponses() {
  return vi.spyOn(global, "fetch").mockImplementation(async (url) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("/api/agents/agent-1/files/SOUL.md")) {
      return { ok: true, json: async () => ({ content: "# Soul" }) } as Response;
    }
    if (urlStr.includes("/api/agents/agent-1/files/AGENTS.md")) {
      return { ok: true, json: async () => ({ content: "# Agents" }) } as Response;
    }
    if (urlStr.includes("/api/agents/agent-1")) {
      return { ok: true, json: async () => agentData } as Response;
    }
    if (urlStr.includes("/api/providers/models")) {
      return { ok: true, json: async () => ({ providers: [] }) } as Response;
    }
    if (urlStr.includes("/api/data-directories")) {
      return { ok: true, json: async () => ({ directories: [] }) } as Response;
    }
    return { ok: false, json: async () => ({}) } as Response;
  });
}

describe("AgentSettingsPage", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetchResponses();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should render the personality tab when clicked", async () => {
    render(<AgentSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Agent Settings")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("tab", { name: /personality/i }));

    await waitFor(() => {
      expect(screen.getByTestId("personality-tab")).toBeInTheDocument();
    });
  });
});
