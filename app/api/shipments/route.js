import { NextResponse } from "next/server"
import { getSession } from "../../../lib/auth"
import { initializeDatabase } from "../../../lib/db"
import { createShipment, getUserById } from "../../../lib/repository"

export async function POST(request) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  const body = await request.json()

  try {
    const shipment = await createShipment({ ...session, user }, body)
    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
