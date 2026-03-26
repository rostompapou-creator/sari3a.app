import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/auth"
import { initializeDatabase } from "../../../../lib/db"
import { getUserById, updateDriverProfile } from "../../../../lib/repository"

export async function PATCH(request) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  const body = await request.json()

  try {
    const profile = await updateDriverProfile({ ...session, user }, body)
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
