import { NextResponse } from "next/server"
import { getSession } from "../../../lib/auth"
import { initializeDatabase } from "../../../lib/db"
import { getAppSettings, getUserById, updateAppSettings } from "../../../lib/repository"

export async function GET() {
  await initializeDatabase()
  const settings = await getAppSettings()
  return NextResponse.json(settings)
}

export async function PATCH(request) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const admin = await getUserById(session.userId)
  const body = await request.json()

  try {
    const settings = await updateAppSettings({ ...session, user: admin }, body)
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
