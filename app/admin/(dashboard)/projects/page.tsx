import { requireAdmin } from "@/lib/admin"
import { listAllProjects } from "@/app/actions/projects"
import { ProjectsPage } from "@/components/admin/missing-sections"
export const metadata = { title: "Проекты" }
export default async function ProjectsAdminPage() { const admin = await requireAdmin("content.read"); const projects = await listAllProjects(); return <ProjectsPage projects={projects} canWrite={admin.permissions.includes("content.write")} /> }
