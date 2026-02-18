import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setSetting } from "@/lib/settings";

export async function GET() {
  const all = await getAllSettings();
  // Filter out encrypted values for display
  const safe = all.map((s) => ({
    ...s,
    value: s.encrypted ? "••••••••" : s.value,
  }));
  return NextResponse.json(safe);
}

export async function POST(request: NextRequest) {
  const { key, value } = await request.json();
  await setSetting(key, value, key.includes("api_key"));
  return NextResponse.json({ success: true });
}
