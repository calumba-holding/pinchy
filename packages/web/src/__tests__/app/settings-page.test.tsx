import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsPage from "@/app/(app)/settings/page";

vi.mock("@/components/provider-key-form", () => ({
  ProviderKeyForm: ({
    onSuccess,
    submitLabel,
  }: {
    onSuccess: () => void;
    submitLabel?: string;
  }) => (
    <button onClick={onSuccess} data-testid="mock-provider-form">
      {submitLabel || "Continue"}
    </button>
  ),
}));

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the page title", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should render LLM Provider section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("LLM Provider")).toBeInTheDocument();
  });

  it("should render the ProviderKeyForm with Save label", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("mock-provider-form")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});
