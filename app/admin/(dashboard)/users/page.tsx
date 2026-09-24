import { requireAdmin } from "@/lib/admin"
import { listUsers } from "@/app/actions/users"
import { UsersManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Пользователи" }
type SP = Record<string, string | string[] | undefined>
export default async function UsersPage({ searchParams }: { searchParams: Promise<SP> }) { const admin = await requireAdmin("users.read"); const sp = await searchParams; const q = Array.isArray(sp.q) ? sp.q[0] : sp.q; const result = await listUsers({ q }); return <UsersManager initial={result} canWrite={admin.permissions.includes("users.write")} /> }
