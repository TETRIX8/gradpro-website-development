import { listNotifications } from "@/app/actions/notifications"
import { NotificationsManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Уведомления" }
export default async function NotificationsPage() { const data = await listNotifications(80); return <NotificationsManager initial={data} /> }
