import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth");

import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";

const forbidden = NextResponse.json({ error: "Forbidden" }, { status: 403 });

beforeEach(() => {
  vi.clearAllMocks();
  (requireAdmin as any).mockResolvedValue(forbidden);
});

describe("groups API security", () => {
  it("GET /api/groups rejects non-admin", async () => {
    const { GET } = await import("@/app/api/groups/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("POST /api/groups rejects non-admin", async () => {
    const { POST } = await import("@/app/api/groups/route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it("PATCH /api/groups/:id rejects non-admin", async () => {
    const { PATCH } = await import("@/app/api/groups/[groupId]/route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Test" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ groupId: "g1" }) });
    expect(res.status).toBe(403);
  });

  it("DELETE /api/groups/:id rejects non-admin", async () => {
    const { DELETE } = await import("@/app/api/groups/[groupId]/route");
    const req = new Request("http://localhost", { method: "DELETE" });
    const res = await DELETE(req as any, { params: Promise.resolve({ groupId: "g1" }) });
    expect(res.status).toBe(403);
  });

  it("GET /api/groups/:id/members rejects non-admin", async () => {
    const { GET } = await import("@/app/api/groups/[groupId]/members/route");
    const req = new Request("http://localhost", { method: "GET" });
    const res = await GET(req as any, { params: Promise.resolve({ groupId: "g1" }) });
    expect(res.status).toBe(403);
  });

  it("PUT /api/groups/:id/members rejects non-admin", async () => {
    const { PUT } = await import("@/app/api/groups/[groupId]/members/route");
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ userIds: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req as any, { params: Promise.resolve({ groupId: "g1" }) });
    expect(res.status).toBe(403);
  });
});
