import { redirect } from "next/navigation"
import { PortalDashboard } from "../../components/PortalDashboard"
import { requireRole } from "../../lib/auth"
import { initializeDatabase } from "../../lib/db"
import { getPortalData } from "../../lib/repository"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  await initializeDatabase()
  const session = await requireRole("admin")
  if (!session) redirect("/login/admin")
  const data = await getPortalData(session)
  return <PortalDashboard role="admin" initialData={data} />
}
