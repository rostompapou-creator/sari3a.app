import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/auth"
import { initializeDatabase } from "../../../../lib/db"
import { confirmShipmentDelivery, getUserById } from "../../../../lib/repository"

export async function POST(request) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  const payload = await request.json()
  const trackingNumber = String(payload?.trackingNumber ?? "").trim()

  if (!trackingNumber) {
    return NextResponse.json({ message: "Tracking requis." }, { status: 400 })
  }

  try {
    const shipment = await confirmShipmentDelivery({ ...session, user }, trackingNumber)
    return NextResponse.json(shipment)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
