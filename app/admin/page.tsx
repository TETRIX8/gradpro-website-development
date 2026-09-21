import { requireSession } from '@/lib/admin'
import { listAllProjects } from '@/app/actions/projects'
import { listLeads } from '@/app/actions/leads'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata = { title: 'Админ-панель — Gradpro' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await requireSession()
  const [projects, leads] = await Promise.all([listAllProjects(), listLeads()])

  return (
    <AdminShell
      user={{ name: session.user.name, email: session.user.email }}
      initialProjects={projects}
      leads={leads}
    />
  )
}
