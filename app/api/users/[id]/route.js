import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/auth"
import { initializeDatabase } from "../../../../lib/db"
import { deleteUser, getUserById, updateUser } from "../../../../lib/repository"

export async function PATCH(request, { params }) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const admin = await getUserById(session.userId)
  const body = await request.json()
  const { id } = await params

  try {
    const updated = await updateUser({ ...session, user: admin }, Number(id), body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const admin = await getUserById(session.userId)
  const { id } = await params

  try {
    const result = await deleteUser({ ...session, user: admin }, Number(id))
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
