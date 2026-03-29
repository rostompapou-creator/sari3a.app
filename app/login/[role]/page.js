import { notFound } from "next/navigation"
import { LoginPanel } from "../../../components/LoginPanel"
import { DEMO_ACCOUNTS } from "../../../lib/constants"
import { initializeDatabase } from "../../../lib/db"
import { isDemoDataEnabled } from "../../../lib/runtime"

export const dynamic = "force-dynamic"

export default async function LoginRolePage({ params }) {
  await initializeDatabase()
  const { role } = await params
  if (!DEMO_ACCOUNTS[role]) notFound()
  return <LoginPanel role={role} demoEnabled={isDemoDataEnabled()} />
}
