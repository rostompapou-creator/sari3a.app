import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/auth"
import { initializeDatabase } from "../../../../lib/db"
import { deleteShipment, getUserById, updateShipment } from "../../../../lib/repository"

export async function PATCH(request, { params }) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  const body = await request.json()
  const { id } = await params

  try {
    const shipment = await updateShipment({ ...session, user }, Number(id), body)
    return NextResponse.json(shipment)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  const { id } = await params

  try {
    const result = await deleteShipment({ ...session, user }, Number(id))
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
