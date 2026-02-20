import { describe, it, expect } from "vitest";
import { agents, settings } from "@/db/schema";

describe("database schema", () => {
  it("should export agents table", () => {
    expect(agents).toBeDefined();
  });

  it("should export settings table", () => {
    expect(settings).toBeDefined();
  });

  it("agents table should have expected columns", () => {
    const columns = Object.keys(agents);
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("model");
    expect(columns).toContain("createdAt");
  });

  it("settings table should have expected columns", () => {
    const columns = Object.keys(settings);
    expect(columns).toContain("key");
    expect(columns).toContain("value");
    expect(columns).toContain("encrypted");
  });
});
