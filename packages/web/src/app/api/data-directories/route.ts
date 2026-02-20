import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const DATA_ROOT = "/data";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!existsSync(DATA_ROOT)) {
    return NextResponse.json({ directories: [] });
  }

  const entries = readdirSync(DATA_ROOT);
  const directories = entries
    .filter((name) => {
      if (name.startsWith(".")) return false;
      const fullPath = join(DATA_ROOT, name);
      return statSync(fullPath).isDirectory();
    })
    .map((name) => ({
      path: join(DATA_ROOT, name),
      name,
    }));

  return NextResponse.json({ directories });
}
