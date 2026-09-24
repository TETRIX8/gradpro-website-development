import { getAllSettings } from "@/app/actions/settings"
import { SettingsManager } from "@/components/admin/missing-sections"
export const metadata = { title: "Настройки" }
export default async function SettingsPage() { const settings = await getAllSettings(); return <SettingsManager initial={settings} /> }
