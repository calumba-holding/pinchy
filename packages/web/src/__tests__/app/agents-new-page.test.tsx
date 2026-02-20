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

vi.mock("@/components/directory-picker", () => ({
  DirectoryPicker: ({
    directories,
    selected,
    onChange,
  }: {
    directories: { path: string; name: string }[];
    selected: string[];
    onChange: (s: string[]) => void;
  }) => (
    <div data-testid="directory-picker">
      {directories.map((d) => (
        <button key={d.path} onClick={() => onChange([...selected, d.path])}>
          {d.name}
        </button>
      ))}
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

    // Mock templates and directories APIs
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
      if (String(url).includes("/api/data-directories")) {
        return {
          ok: true,
          json: async () => ({
            directories: [
              { path: "/data/documents", name: "documents" },
              { path: "/data/hr-docs", name: "hr-docs" },
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

  it("should show configuration form after selecting knowledge-base template", async () => {
    const user = userEvent.setup();
    render(<NewAgentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("template-selector")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Knowledge Base"));
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByTestId("directory-picker")).toBeInTheDocument();
    });
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

  it("should submit agent creation and redirect", async () => {
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
      if (String(url).includes("/api/data-directories")) {
        return {
          ok: true,
          json: async () => ({
            directories: [{ path: "/data/documents", name: "documents" }],
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

    // Select directory
    await user.click(screen.getByText("documents"));

    // Submit
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/chat/new-id");
    });
  });
});
