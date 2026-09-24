import { requireAdmin } from "@/lib/admin"
import { listThreads } from "@/app/actions/messages"
import { MessagesManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Сообщения" }
export default async function MessagesPage() { await requireAdmin("messages.read"); const threads = await listThreads(); return <MessagesManager threads={threads} /> }
