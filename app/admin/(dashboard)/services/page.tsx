import { requireAdmin } from "@/lib/admin"
import { listServices } from "@/app/actions/services"
import { ServicesManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Услуги" }
export default async function ServicesPage() { const admin = await requireAdmin("services.read"); const services = await listServices(); return <ServicesManager initial={services} /> }
