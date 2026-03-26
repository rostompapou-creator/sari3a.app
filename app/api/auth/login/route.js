import { NextResponse } from "next/server"
import { authenticateUser } from "../../../../lib/repository"
import { buildSessionCookie } from "../../../../lib/auth"
import { initializeDatabase } from "../../../../lib/db"

export async function POST(request) {
  await initializeDatabase()
  const body = await request.json()
  const user = await authenticateUser(body.email, body.password, body.role)

  if (!user) {
    return NextResponse.json({ message: "Identifiants invalides pour ce portail." }, { status: 401 })
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email
    }
  })

  response.cookies.set(buildSessionCookie({ userId: user.id, role: user.role }))
  return response
}
