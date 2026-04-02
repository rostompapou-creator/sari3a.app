import { DeliveryScanCard } from "../../../components/DeliveryScanCard"
import { getSession } from "../../../lib/auth"
import { initializeDatabase } from "../../../lib/db"
import { getShipmentForDeliveryScan, getUserById } from "../../../lib/repository"
import { TRACKING_LABELS } from "../../../lib/constants"

export const dynamic = "force-dynamic"

export default async function DeliveryScanPage({ searchParams }) {
  await initializeDatabase()

  const resolvedSearchParams = await searchParams
  const trackingNumber = String(resolvedSearchParams?.tracking ?? "").trim()
  const shipment = trackingNumber ? await getShipmentForDeliveryScan(trackingNumber) : null
  const session = await getSession()
  const user = session ? await getUserById(session.userId) : null

  return (
    <DeliveryScanCard
      shipment={shipment}
      trackingNumber={trackingNumber}
      statusLabel={shipment ? TRACKING_LABELS[shipment.status] ?? shipment.status : ""}
      sessionRole={session?.role ?? ""}
      sessionName={user?.full_name ?? ""}
    />
  )
}
