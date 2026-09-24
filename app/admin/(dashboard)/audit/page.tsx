import { listAuditLog } from "@/app/actions/security"
import { AuditManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Журнал действий" }
export default async function AuditPage() { const data = await listAuditLog(); return <AuditManager data={data} /> }
