import { requireAdminPage } from "@/lib/admin"
import { listAssignees, listLeadFacets, listLeads, type LeadsQuery } from "@/app/actions/leads"
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/constants"
import { LeadsTable } from "@/components/admin/leads/leads-table"

export const metadata = { title: "Заявки" }

type SP = Record<string, string | string[] | undefined>

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const admin = await requireAdminPage("leads.read")
  const sp = await searchParams

  const statusParam = str(sp.status)
  const query: LeadsQuery = {
    q: str(sp.q) || undefined,
    status: statusParam && (LEAD_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as LeadStatus) : "all",
    service: str(sp.service) || undefined,
    source: str(sp.source) || undefined,
    assignee: str(sp.assignee) || undefined,
    from: str(sp.from) || undefined,
    to: str(sp.to) || undefined,
    archived: str(sp.archived) === "1",
    sort: (str(sp.sort) as LeadsQuery["sort"]) || "createdAt",
    dir: str(sp.dir) === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(str(sp.page)) || 1),
    pageSize: 20,
  }

  const [result, facets, assignees] = await Promise.all([listLeads(query), listLeadFacets(), listAssignees()])

  return (
    <LeadsTable
      data={result}
      query={query}
      facets={facets}
      assignees={assignees}
      canWrite={admin.permissions.includes("leads.write")}
      canDelete={admin.permissions.includes("leads.delete")}
    />
  )
}
