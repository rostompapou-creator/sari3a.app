import { DEMO_ACCOUNTS } from "./constants.js"

function envFlag(name) {
  const value = process.env[name]
  if (value === "true") return true
  if (value === "false") return false
  return null
}

export function isDemoDataEnabled() {
  const explicit = envFlag("SARI3A_ENABLE_DEMO_DATA")
  if (explicit !== null) return explicit
  return process.env.NODE_ENV !== "production"
}

export function getInitialAdminConfig() {
  return {
    email: process.env.SARI3A_INITIAL_ADMIN_EMAIL?.trim() || DEMO_ACCOUNTS.admin.email,
    password: process.env.SARI3A_INITIAL_ADMIN_PASSWORD || DEMO_ACCOUNTS.admin.password,
    full_name: process.env.SARI3A_INITIAL_ADMIN_NAME?.trim() || "Administrateur Sari3a",
    phone: process.env.SARI3A_INITIAL_ADMIN_PHONE?.trim() || "+216 70 400 400",
    governorate: process.env.SARI3A_INITIAL_ADMIN_GOVERNORATE?.trim() || "Tunis",
    address: process.env.SARI3A_INITIAL_ADMIN_ADDRESS?.trim() || "Siege Sari3a, Tunis"
  }
}

export function getOnboardingPassword(role) {
  if (role === "driver") {
    return process.env.SARI3A_DRIVER_ONBOARDING_PASSWORD || (isDemoDataEnabled() ? DEMO_ACCOUNTS.driver.password : "Sari3aDriver@2026")
  }

  if (role === "partner") {
    return process.env.SARI3A_PARTNER_ONBOARDING_PASSWORD || (isDemoDataEnabled() ? DEMO_ACCOUNTS.partner.password : "Sari3aPartner@2026")
  }

  return process.env.SARI3A_DEFAULT_ONBOARDING_PASSWORD || "Sari3aUser@2026"
}
