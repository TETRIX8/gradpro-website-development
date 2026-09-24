import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { auditLogs, siteSettings, user as userTable } from "@/lib/db/schema"
import {
  isStaffRole,
  permissionsForRole,
  type Permission,
  type Role,
} from "@/lib/admin/rbac"

export type AdminUser = {
  id: string
  name: string
  email: string
  image: string | null
  role: Role
  twoFactorEnabled: boolean
  permissions: Permission[]
  sessionId: string
}

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" = "FORBIDDEN",
  ) {
    super(message)
  }
}

async function loadRoleOverrides() {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "roles"))
  return (row?.value as Record<string, string[]> | undefined) ?? null
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function hasAnyUser() {
  const [row] = await db.select({ id: userTable.id }).from(userTable).limit(1)
  return Boolean(row)
}

/** Returns the current staff member or null. Never throws. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & {
    role?: string
    banned?: boolean
    twoFactorEnabled?: boolean
  }
  const role = (u.role ?? "user") as Role
  if (u.banned || !isStaffRole(role)) return null
  const overrides = await loadRoleOverrides()
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    role,
    twoFactorEnabled: Boolean(u.twoFactorEnabled),
    permissions: permissionsForRole(role, overrides),
    sessionId: session.session.id,
  }
}

/** For pages: redirects to sign-in when the visitor is not staff. */
export async function requireAdminPage(permission?: Permission): Promise<AdminUser> {
  const admin = await getAdminUser()
  if (!admin) redirect("/admin/sign-in")
  if (permission && !admin.permissions.includes(permission)) redirect("/admin?forbidden=1")
  return admin
}

/** For server actions / API routes: throws instead of redirecting. */
export async function requireAdmin(permission?: Permission): Promise<AdminUser> {
  const admin = await getAdminUser()
  if (!admin) throw new AdminAuthError("Требуется вход администратора", "UNAUTHENTICATED")
  if (permission && !admin.permissions.includes(permission)) {
    throw new AdminAuthError("Недостаточно прав для этого действия", "FORBIDDEN")
  }
  return admin
}

export async function requestMeta() {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null
  return { ip, userAgent: h.get("user-agent") }
}

export async function audit(
  actor: Pick<AdminUser, "id" | "name">,
  input: {
    action: string
    entity: string
    entityId?: string | number | null
    description: string
    metadata?: Record<string, unknown>
  },
) {
  const meta = await requestMeta()
  await db.insert(auditLogs).values({
    actorId: actor.id,
    actorName: actor.name,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId != null ? String(input.entityId) : null,
    description: input.description,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: input.metadata,
  })
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function fail(error: unknown, fallback = "Не удалось выполнить действие"): { ok: false; error: string } {
  if (error instanceof AdminAuthError) return { ok: false, error: error.message }
  if (error instanceof Error && error.name === "ZodError") {
    return { ok: false, error: "Проверьте правильность заполнения полей" }
  }
  console.error("[admin action]", error)
  return { ok: false, error: fallback }
}
