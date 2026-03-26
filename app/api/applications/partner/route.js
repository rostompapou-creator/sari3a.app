import { NextResponse } from "next/server"
import { initializeDatabase } from "../../../../lib/db"
import { submitPartnerApplication } from "../../../../lib/repository"

export async function POST(request) {
  await initializeDatabase()
  const body = await request.json()

  try {
    const created = await submitPartnerApplication(body)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
