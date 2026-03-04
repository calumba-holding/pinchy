import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { appendAuditLog } from "@/lib/audit";

/**
 * After-hook middleware for audit trail logging.
 *
 * Logs auth.login, auth.failed, and auth.logout events.
 * Exported separately so tests can verify the hook logic
 * without instantiating the full Better Auth server.
 */
export const auditAfterHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-in/email") {
    const email = (ctx.body as { email?: string })?.email ?? "unknown";
    const newSession = ctx.context.newSession;

    if (newSession) {
      // Successful login
      try {
        await appendAuditLog({
          actorType: "user",
          actorId: newSession.user.id,
          eventType: "auth.login",
          detail: { email },
        });
      } catch {
        // Don't break auth if audit logging fails
      }
    } else {
      // Failed login attempt
      try {
        await appendAuditLog({
          actorType: "system",
          actorId: "system",
          eventType: "auth.failed",
          detail: { email, reason: "invalid_credentials" },
        });
      } catch {
        // Don't break auth if audit logging fails
      }
    }
  }

  if (ctx.path === "/sign-out") {
    const session = ctx.context.session;
    if (session?.user?.id) {
      try {
        await appendAuditLog({
          actorType: "user",
          actorId: session.user.id,
          eventType: "auth.logout",
          detail: {},
        });
      } catch {
        // Don't break auth if audit logging fails
      }
    }
  }
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
    },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      // Accept legacy bcrypt hashes from pre-migration users
      verify: async ({ password, hash }) => {
        if (hash.startsWith("$2")) {
          return bcrypt.compare(password, hash);
        }
        // Return undefined to fall through to Better Auth's scrypt
        return undefined;
      },
    },
  },
  user: {
    additionalFields: {
      context: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh after 1 day
  },
  hooks: {
    after: auditAfterHook,
  },
});

// Type export for use in other files
export type Session = typeof auth.$Infer.Session;
