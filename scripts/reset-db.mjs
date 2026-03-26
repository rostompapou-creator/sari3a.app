import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, "..", "data", "sari3a.sqlite")

try {
  await fs.rm(dbPath, { force: true })
  console.log(`Base supprimee: ${dbPath}`)
  console.log("Relancez ensuite l'application pour recreer une base propre.")
} catch (error) {
  console.error("Suppression impossible:", error.message)
  process.exitCode = 1
}
