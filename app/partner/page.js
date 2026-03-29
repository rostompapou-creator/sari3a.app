import { redirect } from "next/navigation"
import { PortalDashboard } from "../../components/PortalDashboard"
import { requireRole } from "../../lib/auth"
import { initializeDatabase } from "../../lib/db"
import { getPortalData } from "../../lib/repository"

export const dynamic = "force-dynamic"

export default async function PartnerPage() {
  await initializeDatabase()
  const session = await requireRole("partner")
  if (!session) redirect("/login/partner")
  const data = await getPortalData(session)
  return <PortalDashboard role="partner" initialData={data} />
}
