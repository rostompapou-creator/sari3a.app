import { redirect } from "next/navigation"
import { PortalDashboard } from "../../components/PortalDashboard"
import { requireRole } from "../../lib/auth"
import { initializeDatabase } from "../../lib/db"
import { getPortalData } from "../../lib/repository"

export default async function DriverPage() {
  await initializeDatabase()
  const session = await requireRole("driver")
  if (!session) redirect("/login/driver")
  const data = await getPortalData(session)
  return <PortalDashboard role="driver" initialData={data} />
}
