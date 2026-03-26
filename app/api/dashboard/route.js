import { NextResponse } from "next/server"
import { getSession } from "../../../lib/auth"
import { initializeDatabase } from "../../../lib/db"
import { getPortalData, getUserById } from "../../../lib/repository"

export async function GET() {
  await initializeDatabase()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ message: "Session expirée." }, { status: 401 })
  }

  const user = await getUserById(session.userId)
  if (!user) {
    return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 401 })
  }

  const data = await getPortalData({ ...session, user })
  return NextResponse.json(data)
}
