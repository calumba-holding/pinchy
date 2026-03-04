import { auth } from "@/lib/auth";

export async function validateWsSession(
  cookieHeader: string | undefined
): Promise<{ userId: string; userRole: string } | null> {
  if (!cookieHeader) return null;

  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader }),
    });

    if (!session?.user) return null;

    return {
      userId: session.user.id,
      userRole: (session.user as { role?: string }).role ?? "user",
    };
  } catch {
    return null;
  }
}
