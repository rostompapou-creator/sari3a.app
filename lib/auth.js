import crypto from "node:crypto"
import { cookies } from "next/headers"
import { get } from "./db.js"

const COOKIE_NAME = "sari3a_session"
const SESSION_SECRET = process.env.SARI3A_SESSION_SECRET || "sari3a-session-secret"

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex")
}

export function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token) {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature || sign(payload) !== signature) return null
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return readSessionToken(token)
}

export function buildSessionCookie(user) {
  return {
    name: COOKIE_NAME,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  }
}

export async function requireRole(role) {
  const session = await getSession()
  if (!session || session.role !== role) return null
  const user = await get(
    "SELECT id, role, full_name, email, phone, governorate, address, vehicle, rating, status, current_lat, current_lng FROM users WHERE id = ?",
    [session.userId]
  )
  if (!user) return null
  return { ...session, user }
}
