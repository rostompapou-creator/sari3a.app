import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createClient } from "@libsql/client"
import { DEMO_ACCOUNTS, STATUS_STEPS } from "./constants.js"
import { getInitialAdminConfig, isDemoDataEnabled } from "./runtime.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, "..", "data")
export const dbPath = path.join(dataDir, "sari3a.sqlite")

function resolveDatabaseUrl() {
  const configuredUrl = process.env.LIBSQL_URL || process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL
  if (configuredUrl) return configuredUrl

  if (process.env.VERCEL) {
    throw new Error("LIBSQL_URL manquant en production. Configurez une base libSQL/Turso distante dans les variables d'environnement.")
  }

  fs.mkdirSync(dataDir, { recursive: true })
  return pathToFileURL(dbPath).href
}

function resolveAuthToken() {
  return process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || undefined
}

const client = createClient({
  url: resolveDatabaseUrl(),
  authToken: resolveAuthToken()
})

function normalizeRows(rows = []) {
  return rows.map((row) => ({ ...row }))
}

export async function run(sql, params = []) {
  const statement = /^\s*insert\s+/i.test(sql) && !/\breturning\b/i.test(sql) ? `${sql.trim()} RETURNING id` : sql
  const result = await client.execute({ sql: statement, args: params })
  const firstRow = result.rows?.[0]
  const lastInsertRowid = result.lastInsertRowid ?? firstRow?.id ?? null

  return {
    rowsAffected: Number(result.rowsAffected ?? 0),
    lastID: lastInsertRowid === null || lastInsertRowid === undefined ? undefined : Number(lastInsertRowid)
  }
}

export async function get(sql, params = []) {
  const result = await client.execute({ sql, args: params })
  return normalizeRows(result.rows)[0]
}

export async function all(sql, params = []) {
  const result = await client.execute({ sql, args: params })
  return normalizeRows(result.rows)
}

export function hashPassword(password) {
  const salt = "sari3a-demo-salt"
  return crypto.scryptSync(password, salt, 64).toString("hex")
}

function isoDate(offsetHours = 0) {
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000).toISOString()
}

function tracking(index) {
  return `SR3-${String(2400 + index).padStart(5, "0")}`
}

async function createTables() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    governorate TEXT,
    address TEXT,
    vehicle TEXT,
    rating REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    current_lat REAL,
    current_lng REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    partner_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    driver_id INTEGER,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    governorate TEXT NOT NULL,
    city TEXT,
    package_type TEXT,
    cod_amount REAL DEFAULT 0,
    delivery_fee REAL DEFAULT 0,
    weight REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    pickup_lat REAL,
    pickup_lng REAL,
    current_lat REAL,
    current_lng REAL,
    delivery_lat REAL,
    delivery_lng REAL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    delivered_at TEXT,
    FOREIGN KEY (partner_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES users(id)
  )`)

  await run(`CREATE TABLE IF NOT EXISTS shipment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    actor_role TEXT,
    actor_name TEXT,
    lat REAL,
    lng REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
  )`)

  await run(`CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    brand_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    support_phone TEXT,
    support_email TEXT,
    hero_title TEXT,
    hero_description TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS driver_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    governorate TEXT NOT NULL,
    address TEXT,
    vehicle TEXT NOT NULL,
    experience TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)

  await run(`CREATE TABLE IF NOT EXISTS partner_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    governorate TEXT NOT NULL,
    address TEXT,
    activity TEXT,
    average_shipments INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`)
}

async function seedDatabase() {
  if (!isDemoDataEnabled()) return

  const existing = await get("SELECT COUNT(*) AS total FROM users")
  if (existing?.total) return

  const demoUsers = [
    {
      role: "client",
      full_name: "Amine Trabelsi",
      email: DEMO_ACCOUNTS.client.email,
      phone: "+216 29 100 001",
      governorate: "Tunis",
      address: "Les Berges du Lac, Tunis",
      vehicle: null,
      rating: 4.9,
      current_lat: 36.8535,
      current_lng: 10.3236
    },
    {
      role: "driver",
      full_name: "Youssef Jebali",
      email: DEMO_ACCOUNTS.driver.email,
      phone: "+216 20 200 002",
      governorate: "Tunis",
      address: "Ennasr 2, Ariana",
      vehicle: "Moto Yamaha NMAX",
      rating: 4.8,
      current_lat: 36.8462,
      current_lng: 10.1658
    },
    {
      role: "partner",
      full_name: "Sari3a Store Tunis",
      email: DEMO_ACCOUNTS.partner.email,
      phone: "+216 71 300 300",
      governorate: "Tunis",
      address: "Rue du Lac Turkana, Tunis",
      vehicle: null,
      rating: 4.7,
      current_lat: 36.8354,
      current_lng: 10.2841
    },
    {
      role: "admin",
      full_name: "Administrateur Sari3a",
      email: DEMO_ACCOUNTS.admin.email,
      phone: "+216 70 400 400",
      governorate: "Tunis",
      address: "Siege Sari3a, Tunis",
      vehicle: null,
      rating: 5,
      current_lat: 36.8065,
      current_lng: 10.1815
    },
    {
      role: "driver",
      full_name: "Moez Ben Salem",
      email: "driver2@sari3a.tn",
      phone: "+216 54 222 889",
      governorate: "Sousse",
      address: "Khzema, Sousse",
      vehicle: "Fourgon utilitaire",
      rating: 4.6,
      current_lat: 35.8425,
      current_lng: 10.6369
    },
    {
      role: "client",
      full_name: "Sarra Ben Romdhane",
      email: "client2@sari3a.tn",
      phone: "+216 28 455 678",
      governorate: "Sousse",
      address: "Sahloul 4, Sousse",
      vehicle: null,
      rating: 4.5,
      current_lat: 35.837,
      current_lng: 10.6121
    },
    {
      role: "partner",
      full_name: "Pharma Rapid Sousse",
      email: "partner2@sari3a.tn",
      phone: "+216 73 444 210",
      governorate: "Sousse",
      address: "Avenue Yasser Arafet, Sousse",
      vehicle: null,
      rating: 4.6,
      current_lat: 35.8293,
      current_lng: 10.6381
    }
  ]

  for (const user of demoUsers) {
    await run(
      `INSERT INTO users (role, full_name, email, phone, password_hash, governorate, address, vehicle, rating, status, current_lat, current_lng, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [
        user.role,
        user.full_name,
        user.email,
        user.phone,
        hashPassword("demo123"),
        user.governorate,
        user.address,
        user.vehicle,
        user.rating,
        user.current_lat,
        user.current_lng,
        isoDate(-48),
        isoDate(-1)
      ]
    )
  }

  const users = await all("SELECT id, email FROM users ORDER BY id ASC")
  const byEmail = Object.fromEntries(users.map((user) => [user.email, user]))

  const shipments = [
    {
      tracking_number: tracking(1),
      title: "Cosmetiques premium",
      description: "Pack cadeau avec livraison express",
      partner_id: byEmail["partenaire@sari3a.tn"].id,
      client_id: byEmail["client@sari3a.tn"].id,
      driver_id: byEmail["livreur@sari3a.tn"].id,
      recipient_name: "Amine Trabelsi",
      recipient_phone: "+216 29 100 001",
      recipient_address: "Residence Malak, Les Jardins de Carthage",
      governorate: "Tunis",
      city: "Carthage",
      package_type: "Fragile",
      cod_amount: 145,
      delivery_fee: 8,
      weight: 1.2,
      status: "out_for_delivery",
      pickup_lat: 36.8354,
      pickup_lng: 10.2841,
      current_lat: 36.8521,
      current_lng: 10.2862,
      delivery_lat: 36.8694,
      delivery_lng: 10.2775,
      notes: "Appeler avant livraison",
      created_at: isoDate(-16)
    },
    {
      tracking_number: tracking(2),
      title: "Traitement chronique",
      description: "Livraison planifiee ce soir",
      partner_id: byEmail["partner2@sari3a.tn"].id,
      client_id: byEmail["client2@sari3a.tn"].id,
      driver_id: byEmail["driver2@sari3a.tn"].id,
      recipient_name: "Sarra Ben Romdhane",
      recipient_phone: "+216 28 455 678",
      recipient_address: "Rue Ibn Khaldoun, Sahloul",
      governorate: "Sousse",
      city: "Sahloul",
      package_type: "Sante",
      cod_amount: 92,
      delivery_fee: 7,
      weight: 0.8,
      status: "in_transit",
      pickup_lat: 35.8293,
      pickup_lng: 10.6381,
      current_lat: 35.8404,
      current_lng: 10.6329,
      delivery_lat: 35.837,
      delivery_lng: 10.6121,
      notes: "Contre remboursement",
      created_at: isoDate(-28)
    },
    {
      tracking_number: tracking(3),
      title: "Documents juridiques",
      description: "Remise en main propre",
      partner_id: byEmail["partenaire@sari3a.tn"].id,
      client_id: byEmail["client@sari3a.tn"].id,
      driver_id: byEmail["livreur@sari3a.tn"].id,
      recipient_name: "Amine Trabelsi",
      recipient_phone: "+216 29 100 001",
      recipient_address: "Avenue Hedi Nouira, Ennasr",
      governorate: "Ariana",
      city: "Ennasr",
      package_type: "Documents",
      cod_amount: 0,
      delivery_fee: 10,
      weight: 0.2,
      status: "sorting",
      pickup_lat: 36.8354,
      pickup_lng: 10.2841,
      current_lat: 36.842,
      current_lng: 10.196,
      delivery_lat: 36.8627,
      delivery_lng: 10.1639,
      notes: "Livraison bureau",
      created_at: isoDate(-8)
    },
    {
      tracking_number: tracking(4),
      title: "Equipement sportif",
      description: "Casque et accessoires",
      partner_id: byEmail["partenaire@sari3a.tn"].id,
      client_id: byEmail["client@sari3a.tn"].id,
      driver_id: null,
      recipient_name: "Amine Trabelsi",
      recipient_phone: "+216 29 100 001",
      recipient_address: "Rue des Fruits, La Soukra",
      governorate: "Ariana",
      city: "Raoued",
      package_type: "Standard",
      cod_amount: 210,
      delivery_fee: 9,
      weight: 2.1,
      status: "pending",
      pickup_lat: 36.8354,
      pickup_lng: 10.2841,
      current_lat: 36.8354,
      current_lng: 10.2841,
      delivery_lat: 36.8665,
      delivery_lng: 10.1929,
      notes: "Attente validation livreur",
      created_at: isoDate(-2)
    },
    {
      tracking_number: tracking(5),
      title: "Commande bien-etre",
      description: "Complete et deja remise",
      partner_id: byEmail["partner2@sari3a.tn"].id,
      client_id: byEmail["client2@sari3a.tn"].id,
      driver_id: byEmail["driver2@sari3a.tn"].id,
      recipient_name: "Sarra Ben Romdhane",
      recipient_phone: "+216 28 455 678",
      recipient_address: "Avenue de la Corniche, Hammam Sousse",
      governorate: "Sousse",
      city: "Hammam Sousse",
      package_type: "Fragile",
      cod_amount: 67,
      delivery_fee: 6,
      weight: 0.5,
      status: "delivered",
      pickup_lat: 35.8293,
      pickup_lng: 10.6381,
      current_lat: 35.8602,
      current_lng: 10.6031,
      delivery_lat: 35.8602,
      delivery_lng: 10.6031,
      notes: "Livre avec signature",
      created_at: isoDate(-72),
      delivered_at: isoDate(-48)
    },
    {
      tracking_number: tracking(6),
      title: "Parapharmacie enfant",
      description: "Commande urgente",
      partner_id: byEmail["partenaire@sari3a.tn"].id,
      client_id: byEmail["client@sari3a.tn"].id,
      driver_id: byEmail["livreur@sari3a.tn"].id,
      recipient_name: "Amine Trabelsi",
      recipient_phone: "+216 29 100 001",
      recipient_address: "Residence Elyssa, Lac 2",
      governorate: "Tunis",
      city: "Lac 2",
      package_type: "Sante",
      cod_amount: 36,
      delivery_fee: 5,
      weight: 0.4,
      status: "picked_up",
      pickup_lat: 36.8354,
      pickup_lng: 10.2841,
      current_lat: 36.8394,
      current_lng: 10.2674,
      delivery_lat: 36.8441,
      delivery_lng: 10.2723,
      notes: "Livraison bureau avant 18h",
      created_at: isoDate(-5)
    }
  ]

  for (const shipment of shipments) {
    const result = await run(
      `INSERT INTO shipments (
        tracking_number, title, description, partner_id, client_id, driver_id, recipient_name, recipient_phone, recipient_address,
        governorate, city, package_type, cod_amount, delivery_fee, weight, status, pickup_lat, pickup_lng, current_lat, current_lng,
        delivery_lat, delivery_lng, notes, created_at, updated_at, delivered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shipment.tracking_number,
        shipment.title,
        shipment.description,
        shipment.partner_id,
        shipment.client_id,
        shipment.driver_id,
        shipment.recipient_name,
        shipment.recipient_phone,
        shipment.recipient_address,
        shipment.governorate,
        shipment.city,
        shipment.package_type,
        shipment.cod_amount,
        shipment.delivery_fee,
        shipment.weight,
        shipment.status,
        shipment.pickup_lat,
        shipment.pickup_lng,
        shipment.current_lat,
        shipment.current_lng,
        shipment.delivery_lat,
        shipment.delivery_lng,
        shipment.notes,
        shipment.created_at,
        isoDate(-1),
        shipment.delivered_at ?? null
      ]
    )

    const statuses = STATUS_STEPS.map((step) => step.key)
    const currentIndex = statuses.indexOf(shipment.status)
    const eventSteps = STATUS_STEPS.slice(0, Math.max(currentIndex, 0) + 1)
    for (const [index, step] of eventSteps.entries()) {
      await run(
        `INSERT INTO shipment_events (shipment_id, status, label, description, actor_role, actor_name, lat, lng, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.lastID,
          step.key,
          step.label,
          `${step.label} - ${shipment.title}`,
          index < 2 ? "partner" : "driver",
          index < 2 ? "Equipe partenaire" : "Equipe livraison",
          shipment.pickup_lat + index * 0.003,
          shipment.pickup_lng + index * 0.002,
          isoDate(-(18 - index * 3))
        ]
      )
    }
  }
}

async function ensureAppSettings() {
  const settings = await get("SELECT id FROM app_settings WHERE id = 1")
  if (settings) return

  await run(
    `INSERT INTO app_settings (
      id, brand_name, tagline, support_phone, support_email, hero_title, hero_description, primary_color, secondary_color, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Sari3a Delivery",
      "Livre vite, livre bien",
      "+216 55 22 70 50",
      "contact@sari3a.tn",
      "Livre vite, livre bien.",
      "Sari3a centralise le suivi GPS, les candidatures publiques et tout le cycle du colis du retrait chez le partenaire a la livraison finale.",
      "#081a44",
      "#d6a328",
      isoDate()
    ]
  )
}

async function ensureAdminAccount() {
  const config = getInitialAdminConfig()
  const currentAdmin = await get("SELECT id FROM users WHERE role = 'admin' AND email = ?", [config.email])
  if (currentAdmin) return

  const anyAdmin = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
  if (anyAdmin) return

  await run(
    `INSERT INTO users (role, full_name, email, phone, password_hash, governorate, address, vehicle, rating, status, current_lat, current_lng, created_at, updated_at)
     VALUES ('admin', ?, ?, ?, ?, ?, ?, NULL, 5, 'active', ?, ?, ?, ?)`,
    [
      config.full_name,
      config.email,
      config.phone,
      hashPassword(config.password),
      config.governorate,
      config.address,
      36.8065,
      10.1815,
      isoDate(),
      isoDate()
    ]
  )
}

let initializationPromise = null

export async function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await createTables()
      await seedDatabase()
      await ensureAppSettings()
      await ensureAdminAccount()
    })()
  }
  await initializationPromise
}
