import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string, encrypted = false) {
  await db.insert(settings).values({ key, value, encrypted }).onConflictDoUpdate({
    target: settings.key,
    set: { value, encrypted },
  });
}

export async function getAllSettings() {
  return db.select().from(settings);
}
