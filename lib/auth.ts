import { betterAuth } from "better-auth"
import { admin as adminPlugin, twoFactor } from "better-auth/plugins"
import { createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { eq, sql } from "drizzle-orm"
import { pool, db } from "@/lib/db"
import { loginAttempts, notifications, user as userTable } from "@/lib/db/schema"
import { parseDevice } from "@/lib/admin/device"

const trustedOrigins: string[] = []
if (process.env.NODE_ENV === "development") {
  trustedOrigins.push("http://localhost:3000")
  for (const key of ["V0_RUNTIME_URL", "V0_DEV_APP_URL", "V0_BUILD_URL", "V0_SANDBOX_URL"]) {
    const v = process.env[key]
    if (v) trustedOrigins.push(v)
  }
}
if (process.env.NODE_ENV === "production") {
  if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    trustedOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
}

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  trustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      lastLoginAt: { type: "date", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => {
          // The very first account registered becomes the administrator;
          // every subsequent sign-up is a regular user until promoted.
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(userTable)
          return { data: { ...u, role: count === 0 ? "admin" : "user" } }
        },
        after: async (u) => {
          await db.insert(notifications).values({
            type: "user",
            title: "Новый пользователь",
            body: `${u.name} (${u.email}) зарегистрировался`,
            href: "/admin/users",
          })
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return
      const email = String((ctx.body as { email?: string } | undefined)?.email ?? "")
      if (!email) return
      const ua = ctx.headers?.get("user-agent") ?? null
      const ip =
        ctx.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        ctx.headers?.get("x-real-ip") ??
        null
      const newSession = ctx.context.newSession
      const success = Boolean(newSession)
      await db.insert(loginAttempts).values({
        userId: newSession?.user.id ?? null,
        email,
        success,
        ip,
        userAgent: ua,
        device: parseDevice(ua),
      })
      if (newSession) {
        await db
          .update(userTable)
          .set({ lastLoginAt: new Date() })
          .where(eq(userTable.id, newSession.user.id))
      }
    }),
  },
  plugins: [
    adminPlugin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    twoFactor({ issuer: "GradPro Admin" }),
    nextCookies(),
  ],
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})

export type Session = typeof auth.$Infer.Session
