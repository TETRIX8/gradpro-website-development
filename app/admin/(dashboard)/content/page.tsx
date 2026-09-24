import { requireAdmin } from "@/lib/admin"
import { listSections } from "@/app/actions/content"
import { ContentManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Контент сайта" }
export default async function ContentPage() { await requireAdmin("content.read"); const sections = await listSections(); return <ContentManager sections={sections} /> }

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ContentPageData = any
/* eslint-enable @typescript-eslint/no-explicit-any */
