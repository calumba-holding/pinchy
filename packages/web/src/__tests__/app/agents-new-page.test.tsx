import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/components/template-selector", () => ({
  TemplateSelector: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div data-testid="template-selector">
      <button onClick={() => onSelect("knowledge-base")}>Knowledge Base</button>
      <button onClick={() => onSelect("custom")}>Custom Agent</button>
    </div>
  ),
}));

import NewAgentPage from "@/app/(app)/agents/new/page";
import { useRouter } from "next/navigation";

describe("New Agent Page", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(vi.fn());
    vi.clearAllMocks();

    // Mock templates API only — no more data-directories
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (String(url).includes("/api/templates")) {
        return {
          ok: true,
          json: async () => ({
            templates: [
              {
                id: "knowledge-base",
                name: "Knowledge Base",
                description: "Answer questions from your docs",
              },
              { id: "custom", name: "Custom Agent", description: "Start from scratch" },
            ],
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should show template selection initially", async () => {
    render(<NewAgentPage />);
    await waitFor(() => {
      expect(screen.getByText("Create New Agent")).toBeInTheDocument();
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });
  });

  it("should show name form after selecting template without directory picker", async () => {
    const user = userEvent.setup();
    render(<NewAgentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Knowledge Base"));
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
    // Directory picker should NOT be present
    expect(screen.queryByTestId("directory-picker")).not.toBeInTheDocument();
  });

  it("should not fetch data-directories API", async () => {
    render(<NewAgentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });
    // Only templates API should be called, not data-directories
    const fetchCalls = vi.mocked(global.fetch).mock.calls.map((c) => String(c[0]));
    expect(fetchCalls.some((url) => url.includes("/api/data-directories"))).toBe(false);
  });

  it("should show validation error when submitting with empty name", async () => {
    const user = userEvent.setup();
    render(<NewAgentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Custom Agent"));
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Submit without filling the name
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    // Should not have called the agents API
    expect(global.fetch).not.toHaveBeenCalledWith("/api/agents", expect.anything());
  });

  it("should render Back to templates link outside the form element", async () => {
    const user = userEvent.setup();
    render(<NewAgentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Knowledge Base"));
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    const backButton = screen.getByText(/back to templates/i);
    expect(backButton).toBeInTheDocument();

    // The back button should not be inside the form element
    const formElement = screen.getByLabelText(/name/i).closest("form");
    expect(formElement).not.toContainElement(backButton);
  });

  it("should submit agent creation without pluginConfig and redirect", async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push, back: vi.fn() } as any);

    vi.mocked(global.fetch).mockImplementation(async (url, opts) => {
      if (String(url).includes("/api/agents") && opts?.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => ({ id: "new-id", name: "Test Agent" }),
        } as Response;
      }
      if (String(url).includes("/api/templates")) {
        return {
          ok: true,
          json: async () => ({
            templates: [
              { id: "knowledge-base", name: "Knowledge Base", description: "docs" },
              { id: "custom", name: "Custom Agent", description: "scratch" },
            ],
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    });

    render(<NewAgentPage />);

    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });

    // Select template
    await user.click(screen.getByText("Knowledge Base"));

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill name
    await user.type(screen.getByLabelText(/name/i), "Test Agent");

    // Submit — no directory selection needed
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/chat/new-id");
    });

    // Verify pluginConfig was NOT sent in the POST body
    const agentCall = vi
      .mocked(global.fetch)
      .mock.calls.find(
        (c) => String(c[0]).includes("/api/agents") && (c[1] as any)?.method === "POST"
      );
    expect(agentCall).toBeDefined();
    const sentBody = JSON.parse((agentCall![1] as any).body);
    expect(sentBody).not.toHaveProperty("pluginConfig");
  });
});
