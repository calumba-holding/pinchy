import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Chat } from "@/components/chat";

// Mock the runtime hook
vi.mock("@/hooks/use-ws-runtime", () => ({
  useWsRuntime: () => ({
    runtime: {},
    isConnected: true,
  }),
}));

// Mock assistant-ui
vi.mock("@assistant-ui/react", () => ({
  AssistantRuntimeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock the Thread component
vi.mock("@/components/assistant-ui/thread", () => ({
  Thread: () => <div data-testid="thread">Thread</div>,
}));

describe("Chat", () => {
  it("should render agent name in header", () => {
    render(<Chat agentId="agent-1" agentName="Smithers" />);
    expect(screen.getByText("Smithers")).toBeInTheDocument();
  });

  it("should show connected status", () => {
    render(<Chat agentId="agent-1" agentName="Smithers" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("should render the Thread component", () => {
    render(<Chat agentId="agent-1" agentName="Smithers" />);
    expect(screen.getByTestId("thread")).toBeInTheDocument();
  });
});
