import { NextResponse } from "next/server"
import { getSession } from "../../../../../lib/auth"
import { initializeDatabase } from "../../../../../lib/db"
import { getUserById, reviewDriverApplication } from "../../../../../lib/repository"

export async function PATCH(request, context) {
  await initializeDatabase()
  const session = await getSession()
  if (!session) return NextResponse.json({ message: "Session requise." }, { status: 401 })

  const user = await getUserById(session.userId)
  if (!user) return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 401 })

  const body = await request.json()
  const { id } = await context.params

  try {
    const result = await reviewDriverApplication({ ...session, user }, Number(id), body.status)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
