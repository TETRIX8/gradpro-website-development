import { requireAdmin } from "@/lib/admin"
import { getSecuritySummary, listLoginHistory, listMySessions } from "@/app/actions/security"
import { SecurityManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Безопасность" }
export default async function SecurityPage() { await requireAdmin("security.read"); const [summary, sessions, logins] = await Promise.all([getSecuritySummary(), listMySessions(), listLoginHistory(1, "all")]); return <SecurityManager summary={summary} sessions={sessions} logins={logins} /> }
