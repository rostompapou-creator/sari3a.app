import { LandingExperience } from "../components/LandingExperience"
import { GOVERNORATES } from "../lib/constants"
import { initializeDatabase } from "../lib/db"
import { getAppSettings, getPublicStats } from "../lib/repository"

export default async function HomePage() {
  await initializeDatabase()
  const [stats, settings] = await Promise.all([getPublicStats(), getAppSettings()])

  return <LandingExperience stats={stats} settings={settings} governorates={GOVERNORATES} />
}
