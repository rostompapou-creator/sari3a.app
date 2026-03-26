import { redirect } from "next/navigation"
import { PortalDashboard } from "../../components/PortalDashboard"
import { requireRole } from "../../lib/auth"
import { initializeDatabase } from "../../lib/db"
import { getPortalData } from "../../lib/repository"

export default async function ClientPage() {
  await initializeDatabase()
  const session = await requireRole("client")
  if (!session) redirect("/login/client")
  const data = await getPortalData(session)
  return <PortalDashboard role="client" initialData={data} />
}
