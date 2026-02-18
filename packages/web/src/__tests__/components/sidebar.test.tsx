import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  it("should render Pinchy branding", () => {
    render(<Sidebar agents={[]} />);
    expect(screen.getByText("Pinchy")).toBeInTheDocument();
  });

  it("should render agent names", () => {
    const agents = [
      { id: "1", name: "Smithers", model: "anthropic/claude-sonnet-4-20250514" },
    ];
    render(<Sidebar agents={agents} />);
    expect(screen.getByText("Smithers")).toBeInTheDocument();
  });

  it("should render settings link", () => {
    render(<Sidebar agents={[]} />);
    expect(screen.getByRole("link", { name: /settings|einstellungen/i })).toBeInTheDocument();
  });
});
