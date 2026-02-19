import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { PROVIDERS } from "@/lib/providers";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const defaultProvider = await getSetting("default_provider");

  const providers: Record<string, { configured: boolean; hint?: string }> = {};
  for (const [name, config] of Object.entries(PROVIDERS)) {
    const value = await getSetting(config.settingsKey);
    providers[name] = {
      configured: value !== null,
      ...(value ? { hint: value.slice(-4) } : {}),
    };
  }

  return NextResponse.json({ defaultProvider, providers });
}
