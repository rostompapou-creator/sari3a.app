import { NextResponse } from "next/server"
import { getSession } from "../../../../../lib/auth"
import { initializeDatabase } from "../../../../../lib/db"
import { advanceShipmentStatus, getUserById } from "../../../../../lib/repository"

export async function POST(request, { params }) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  const { id } = await params

  try {
    const shipment = await advanceShipmentStatus({ ...session, user }, Number(id))
    return NextResponse.json(shipment)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
