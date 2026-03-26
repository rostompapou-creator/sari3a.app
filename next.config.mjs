import { fileURLToPath } from "node:url"

const rootDir = fileURLToPath(new URL("./", import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sqlite3"],
  turbopack: {
    root: rootDir
  }
}

export default nextConfig
