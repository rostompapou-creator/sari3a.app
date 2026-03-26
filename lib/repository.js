import { all, get, hashPassword, initializeDatabase, run } from "./db.js"
import { DEFAULT_CITIES, GOVERNORATES, STATUS_STEPS, TRACKING_LABELS } from "./constants.js"
import { getOnboardingPassword } from "./runtime.js"

const statusOrder = STATUS_STEPS.map((step) => step.key)

function buildWhere(role, userId) {
  if (role === "client") return { clause: "WHERE s.client_id = ?", params: [userId] }
  if (role === "driver") return { clause: "WHERE s.driver_id = ?", params: [userId] }
  if (role === "partner") return { clause: "WHERE s.partner_id = ?", params: [userId] }
  return { clause: "", params: [] }
}

function coerceNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function nowIso() {
  return new Date().toISOString()
}

function nextTrackingNumber(existingCount) {
  return `SR3-${String(2500 + existingCount + 1).padStart(5, "0")}`
}

function normalizeWhatsappPhone(phone) {
  const digits = String(phone ?? "").replace(/[^\d]+/g, "")
  if (!digits) return null
  if (digits.startsWith("00")) return digits.slice(2)
  return digits
}

function buildDriverAssignmentWhatsappUrl(driver, shipment) {
  const phone = normalizeWhatsappPhone(driver?.phone)
  if (!phone) return null

  const message = [
    "Bonjour, une nouvelle livraison Sari3a vous a ete assignee.",
    `Colis: ${shipment.tracking_number}`,
    `Client: ${shipment.recipient_name}`,
    `Adresse: ${shipment.recipient_address}`,
    `Gouvernorat: ${shipment.governorate}${shipment.city ? ` - ${shipment.city}` : ""}`,
    shipment.recipient_phone ? `Telephone client: ${shipment.recipient_phone}` : null
  ]
    .filter(Boolean)
    .join("\n")

  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
}

function buildApplicationApprovalWhatsappUrl(application, role) {
  const phone = normalizeWhatsappPhone(application?.phone)
  if (!phone) return null
  const onboardingPassword = getOnboardingPassword(role)

  if (role === "driver") {
    const message = [
      `Bonjour ${application.full_name}, votre candidature Sari3a a ete validee.`,
      "Vous pouvez maintenant acceder a la plateforme livreur.",
      `Email: ${application.email}`,
      `Mot de passe provisoire: ${onboardingPassword}`,
      `Zone: ${application.governorate}`,
      application.vehicle ? `Vehicule: ${application.vehicle}` : null
    ]
      .filter(Boolean)
      .join("\n")

    return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
  }

  const message = [
    `Bonjour ${application.contact_name}, votre demande partenaire Sari3a a ete validee.`,
    "Votre espace partenaire est pret.",
    `Entreprise: ${application.business_name}`,
    `Email: ${application.email}`,
    `Mot de passe provisoire: ${onboardingPassword}`
  ]
    .filter(Boolean)
    .join("\n")

  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
}

function normalizeApplicationStatus(status) {
  if (status === "approved" || status === "rejected" || status === "pending") return status
  throw new Error("Statut de candidature invalide")
}

function assertAdminSession(session) {
  if (session.role !== "admin") throw new Error("Seul l'admin peut gerer les candidatures")
}

async function getUserByEmail(email) {
  return get("SELECT * FROM users WHERE email = ?", [email])
}

async function setExistingUserState(role, email, status) {
  const existing = await getUserByEmail(email)
  if (!existing) return null
  if (existing.role !== role) throw new Error("Un utilisateur existe deja avec cet email dans un autre portail")

  await run(
    `UPDATE users
     SET status = ?, updated_at = ?
     WHERE id = ?`,
    [status, nowIso(), existing.id]
  )

  return getUserById(existing.id)
}

async function upsertApprovedUser(role, fields, password) {
  const existing = await getUserByEmail(fields.email)

  if (existing && existing.role !== role) {
    throw new Error("Un utilisateur existe deja avec cet email dans un autre portail")
  }

  if (existing) {
    await run(
      `UPDATE users
       SET full_name = ?, phone = ?, password_hash = ?, governorate = ?, address = ?, vehicle = ?,
           rating = ?, status = 'active', current_lat = ?, current_lng = ?, updated_at = ?
       WHERE id = ?`,
      [
        fields.full_name,
        fields.phone,
        hashPassword(password),
        fields.governorate,
        fields.address,
        fields.vehicle,
        fields.rating,
        fields.current_lat,
        fields.current_lng,
        nowIso(),
        existing.id
      ]
    )

    return getUserById(existing.id)
  }

  const result = await run(
    `INSERT INTO users (role, full_name, email, phone, password_hash, governorate, address, vehicle, rating, status, current_lat, current_lng, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
    [
      role,
      fields.full_name,
      fields.email,
      fields.phone,
      hashPassword(password),
      fields.governorate,
      fields.address,
      fields.vehicle,
      fields.rating,
      fields.current_lat,
      fields.current_lng,
      nowIso(),
      nowIso()
    ]
  )

  return getUserById(result.lastID)
}

async function getDriverApplicationById(applicationId) {
  return get("SELECT * FROM driver_applications WHERE id = ?", [applicationId])
}

async function getPartnerApplicationById(applicationId) {
  return get("SELECT * FROM partner_applications WHERE id = ?", [applicationId])
}

async function listShipmentsForRole(role, userId) {
  await initializeDatabase()
  const filter = buildWhere(role, userId)
  return all(
    `SELECT
      s.*,
      p.full_name AS partner_name,
      c.full_name AS client_name,
      d.full_name AS driver_name,
      d.phone AS driver_phone,
      d.vehicle AS driver_vehicle,
      d.rating AS driver_rating
     FROM shipments s
     LEFT JOIN users p ON p.id = s.partner_id
     LEFT JOIN users c ON c.id = s.client_id
     LEFT JOIN users d ON d.id = s.driver_id
     ${filter.clause}
     ORDER BY datetime(s.updated_at) DESC, s.id DESC`,
    filter.params
  )
}

async function getEventsForShipmentIds(ids) {
  if (!ids.length) return []
  const placeholders = ids.map(() => "?").join(", ")
  return all(
    `SELECT *
     FROM shipment_events
     WHERE shipment_id IN (${placeholders})
     ORDER BY datetime(created_at) ASC, id ASC`,
    ids
  )
}

function buildStats(shipments) {
  const totalRevenue = shipments.reduce((sum, shipment) => sum + Number(shipment.delivery_fee || 0), 0)
  const codPending = shipments
    .filter((shipment) => shipment.status !== "delivered")
    .reduce((sum, shipment) => sum + Number(shipment.cod_amount || 0), 0)

  return {
    total: shipments.length,
    delivered: shipments.filter((shipment) => shipment.status === "delivered").length,
    inMotion: shipments.filter((shipment) => ["in_transit", "out_for_delivery", "picked_up", "sorting"].includes(shipment.status)).length,
    urgent: shipments.filter((shipment) => shipment.status === "pending").length,
    totalRevenue,
    codPending
  }
}

function attachEvents(shipments, events) {
  const byShipment = events.reduce((map, event) => {
    if (!map[event.shipment_id]) map[event.shipment_id] = []
    map[event.shipment_id].push(event)
    return map
  }, {})

  return shipments.map((shipment) => ({
    ...shipment,
    events: byShipment[shipment.id] ?? []
  }))
}

export async function authenticateUser(email, password, role) {
  await initializeDatabase()
  const user = await get(
    "SELECT id, role, full_name, email, phone, governorate, address, vehicle, rating, status, current_lat, current_lng, password_hash FROM users WHERE email = ? AND role = ?",
    [email, role]
  )

  if (!user || user.password_hash !== hashPassword(password)) return null
  return user
}

export async function getPortalData(session) {
  await initializeDatabase()
  const shipments = await listShipmentsForRole(session.role, session.userId)
  const shipmentIds = shipments.map((shipment) => shipment.id)
  const events = await getEventsForShipmentIds(shipmentIds)
  const drivers = await all("SELECT id, full_name, phone, vehicle, governorate, rating, status, current_lat, current_lng FROM users WHERE role = 'driver' ORDER BY full_name ASC")
  const clients = await all("SELECT id, full_name, email, phone, governorate, address, status FROM users WHERE role = 'client' ORDER BY full_name ASC")
  const partners = await all("SELECT id, full_name, email, phone, governorate, address, status FROM users WHERE role = 'partner' ORDER BY full_name ASC")
  const admins = await all("SELECT id, full_name, email, phone, governorate, status FROM users WHERE role = 'admin' ORDER BY full_name ASC")
  const settings = await getAppSettings()
  const driverApplications =
    session.role === "admin"
      ? await all("SELECT * FROM driver_applications ORDER BY datetime(created_at) DESC, id DESC LIMIT 20")
      : []
  const partnerApplications =
    session.role === "admin"
      ? await all("SELECT * FROM partner_applications ORDER BY datetime(created_at) DESC, id DESC LIMIT 20")
      : []

  return {
    generatedAt: nowIso(),
    role: session.role,
    user: session.user,
    stats: buildStats(shipments),
    shipments: attachEvents(shipments, events),
    drivers,
    clients,
    partners,
    admins,
    settings,
    driverApplications,
    partnerApplications,
    governorates: GOVERNORATES,
    cities: DEFAULT_CITIES
  }
}

export async function getPublicStats() {
  await initializeDatabase()
  const shipments = await all("SELECT status, delivery_fee FROM shipments")
  const activeDrivers = await get("SELECT COUNT(*) AS total FROM users WHERE role = 'driver' AND status = 'active'")
  const partners = await get("SELECT COUNT(*) AS total FROM users WHERE role = 'partner'")
  return {
    shipmentsToday: shipments.length,
    driversOnline: activeDrivers?.total ?? 0,
    partners: partners?.total ?? 0,
    deliveredRate:
      shipments.length === 0
        ? 0
        : Math.round((shipments.filter((shipment) => shipment.status === "delivered").length / shipments.length) * 100)
  }
}

export async function getAppSettings() {
  await initializeDatabase()
  return get("SELECT * FROM app_settings WHERE id = 1")
}

async function getShipmentById(id) {
  return get("SELECT * FROM shipments WHERE id = ?", [id])
}

async function addEvent(shipmentId, status, description, actorRole, actorName, lat, lng) {
  await run(
    `INSERT INTO shipment_events (shipment_id, status, label, description, actor_role, actor_name, lat, lng, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [shipmentId, status, TRACKING_LABELS[status] ?? status, description, actorRole, actorName, lat ?? null, lng ?? null, nowIso()]
  )
}

function assertCanAccessShipment(session, shipment) {
  if (!shipment) throw new Error("Colis introuvable")
  if (session.role === "admin") return
  if (session.role === "partner" && shipment.partner_id === session.userId) return
  if (session.role === "client" && shipment.client_id === session.userId) return
  if (session.role === "driver" && shipment.driver_id === session.userId) return
  throw new Error("Acces refuse a ce colis")
}

export async function createShipment(session, payload) {
  await initializeDatabase()

  if (!["partner", "admin", "client"].includes(session.role)) {
    throw new Error("Creation non autorisee")
  }

  const total = await get("SELECT COUNT(*) AS total FROM shipments")
  const trackingNumber = nextTrackingNumber(total?.total ?? 0)
  let partnerId = coerceNumber(payload.partner_id, session.role === "partner" ? session.userId : null)
  let clientId = coerceNumber(payload.client_id, session.role === "client" ? session.userId : null)

  if (session.role === "partner") partnerId = session.userId
  if (session.role === "client") clientId = session.userId
  if (!partnerId || !clientId) throw new Error("Client et partenaire requis")

  const assignedDriverId = payload.driver_id ? coerceNumber(payload.driver_id, null) : null
  const pickupLat = coerceNumber(payload.pickup_lat, session.user.current_lat ?? 36.8065)
  const pickupLng = coerceNumber(payload.pickup_lng, session.user.current_lng ?? 10.1815)
  const deliveryLat = coerceNumber(payload.delivery_lat, pickupLat + 0.02)
  const deliveryLng = coerceNumber(payload.delivery_lng, pickupLng + 0.02)

  const result = await run(
    `INSERT INTO shipments (
      tracking_number, title, description, partner_id, client_id, driver_id, recipient_name, recipient_phone, recipient_address,
      governorate, city, package_type, cod_amount, delivery_fee, weight, status, pickup_lat, pickup_lng, current_lat, current_lng,
      delivery_lat, delivery_lng, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trackingNumber,
      payload.title || "Nouveau colis",
      payload.description || "",
      partnerId,
      clientId,
      assignedDriverId,
      payload.recipient_name || session.user.full_name,
      payload.recipient_phone || session.user.phone || "",
      payload.recipient_address || session.user.address || "",
      payload.governorate || session.user.governorate || "Tunis",
      payload.city || DEFAULT_CITIES[payload.governorate]?.[0] || "Centre Ville",
      payload.package_type || "Standard",
      coerceNumber(payload.cod_amount, 0),
      coerceNumber(payload.delivery_fee, 8),
      coerceNumber(payload.weight, 0.5),
      pickupLat,
      pickupLng,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      payload.notes || "",
      nowIso(),
      nowIso()
    ]
  )

  await addEvent(result.lastID, "pending", "Colis cree dans la plateforme Sari3a", session.role, session.user.full_name, pickupLat, pickupLng)
  const shipment = await getShipmentById(result.lastID)
  const driver = assignedDriverId ? await getUserById(assignedDriverId) : null

  return {
    shipment,
    whatsappUrl: driver ? buildDriverAssignmentWhatsappUrl(driver, shipment) : null
  }
}

export async function updateShipment(session, shipmentId, payload) {
  await initializeDatabase()
  const shipment = await getShipmentById(shipmentId)
  assertCanAccessShipment(session, shipment)

  if (session.role === "driver") throw new Error("Le livreur ne peut pas modifier ce formulaire")
  if (session.role === "client" && !["pending", "picked_up"].includes(shipment.status)) {
    throw new Error("Le client ne peut modifier que les colis encore en preparation")
  }

  const fields = {
    title: payload.title ?? shipment.title,
    description: payload.description ?? shipment.description,
    recipient_name: payload.recipient_name ?? shipment.recipient_name,
    recipient_phone: payload.recipient_phone ?? shipment.recipient_phone,
    recipient_address: payload.recipient_address ?? shipment.recipient_address,
    governorate: payload.governorate ?? shipment.governorate,
    city: payload.city ?? shipment.city,
    package_type: payload.package_type ?? shipment.package_type,
    cod_amount: coerceNumber(payload.cod_amount, shipment.cod_amount),
    delivery_fee: coerceNumber(payload.delivery_fee, shipment.delivery_fee),
    weight: coerceNumber(payload.weight, shipment.weight),
    driver_id: payload.driver_id === "" ? null : coerceNumber(payload.driver_id, shipment.driver_id),
    pickup_lat: coerceNumber(payload.pickup_lat, shipment.pickup_lat),
    pickup_lng: coerceNumber(payload.pickup_lng, shipment.pickup_lng),
    delivery_lat: coerceNumber(payload.delivery_lat, shipment.delivery_lat),
    delivery_lng: coerceNumber(payload.delivery_lng, shipment.delivery_lng),
    notes: payload.notes ?? shipment.notes
  }

  await run(
    `UPDATE shipments
     SET title = ?, description = ?, recipient_name = ?, recipient_phone = ?, recipient_address = ?,
         governorate = ?, city = ?, package_type = ?, cod_amount = ?, delivery_fee = ?, weight = ?,
         driver_id = ?, pickup_lat = ?, pickup_lng = ?, delivery_lat = ?, delivery_lng = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      fields.title,
      fields.description,
      fields.recipient_name,
      fields.recipient_phone,
      fields.recipient_address,
      fields.governorate,
      fields.city,
      fields.package_type,
      fields.cod_amount,
      fields.delivery_fee,
      fields.weight,
      fields.driver_id,
      fields.pickup_lat,
      fields.pickup_lng,
      fields.delivery_lat,
      fields.delivery_lng,
      fields.notes,
      nowIso(),
      shipmentId
    ]
  )

  await addEvent(shipmentId, shipment.status, "Informations du colis mises a jour", session.role, session.user.full_name, fields.pickup_lat, fields.pickup_lng)
  const updatedShipment = await getShipmentById(shipmentId)
  const driverAssignedNow = fields.driver_id && Number(fields.driver_id) !== Number(shipment.driver_id)
  const driver = driverAssignedNow ? await getUserById(fields.driver_id) : null

  return {
    shipment: updatedShipment,
    whatsappUrl: driver ? buildDriverAssignmentWhatsappUrl(driver, updatedShipment) : null
  }
}

export async function deleteShipment(session, shipmentId) {
  await initializeDatabase()
  const shipment = await getShipmentById(shipmentId)
  assertCanAccessShipment(session, shipment)

  if (session.role === "client" && shipment.status !== "pending") {
    throw new Error("Le client ne peut supprimer qu'un colis en attente")
  }
  if (session.role === "partner" && shipment.status === "delivered") {
    throw new Error("Le partenaire ne peut pas supprimer un colis deja livre")
  }

  await run("DELETE FROM shipment_events WHERE shipment_id = ?", [shipmentId])
  await run("DELETE FROM shipments WHERE id = ?", [shipmentId])
  return { success: true }
}

export async function advanceShipmentStatus(session, shipmentId) {
  await initializeDatabase()
  const shipment = await getShipmentById(shipmentId)
  assertCanAccessShipment(session, shipment)

  if (!["driver", "admin", "partner"].includes(session.role)) {
    throw new Error("Transition de statut non autorisee")
  }

  const currentIndex = statusOrder.indexOf(shipment.status)
  if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return shipment

  const nextStatus = statusOrder[currentIndex + 1]
  const currentLat = session.user.current_lat ?? shipment.current_lat
  const currentLng = session.user.current_lng ?? shipment.current_lng
  const isDelivered = nextStatus === "delivered"

  await run(
    `UPDATE shipments
     SET status = ?, current_lat = ?, current_lng = ?, updated_at = ?, delivered_at = CASE WHEN ? THEN ? ELSE delivered_at END
     WHERE id = ?`,
    [nextStatus, currentLat, currentLng, nowIso(), isDelivered ? 1 : 0, isDelivered ? nowIso() : null, shipmentId]
  )

  await addEvent(shipmentId, nextStatus, `Statut passe a ${TRACKING_LABELS[nextStatus]}`, session.role, session.user.full_name, currentLat, currentLng)
  return getShipmentById(shipmentId)
}

export async function updateDriverProfile(session, payload) {
  await initializeDatabase()
  if (session.role !== "driver") throw new Error("Acces refuse")

  const lat = coerceNumber(payload.current_lat, session.user.current_lat ?? 36.8065)
  const lng = coerceNumber(payload.current_lng, session.user.current_lng ?? 10.1815)
  await run(
    `UPDATE users
     SET phone = ?, vehicle = ?, governorate = ?, address = ?, current_lat = ?, current_lng = ?, updated_at = ?
     WHERE id = ?`,
    [
      payload.phone ?? session.user.phone,
      payload.vehicle ?? session.user.vehicle,
      payload.governorate ?? session.user.governorate,
      payload.address ?? session.user.address,
      lat,
      lng,
      nowIso(),
      session.userId
    ]
  )

  await run(
    `UPDATE shipments
     SET current_lat = ?, current_lng = ?, updated_at = ?
     WHERE driver_id = ? AND status IN ('picked_up', 'sorting', 'in_transit', 'out_for_delivery')`,
    [lat, lng, nowIso(), session.userId]
  )

  return get("SELECT id, role, full_name, email, phone, governorate, address, vehicle, rating, status, current_lat, current_lng FROM users WHERE id = ?", [session.userId])
}

export async function createUser(session, payload) {
  await initializeDatabase()
  if (session.role !== "admin") throw new Error("Seul l'admin peut creer un utilisateur")

  const result = await run(
    `INSERT INTO users (role, full_name, email, phone, password_hash, governorate, address, vehicle, rating, status, current_lat, current_lng, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.role || "client",
      payload.full_name || "Nouvel utilisateur",
      payload.email,
      payload.phone || "",
      hashPassword(payload.password || "demo123"),
      payload.governorate || GOVERNORATES[0],
      payload.address || "",
      payload.vehicle || null,
      coerceNumber(payload.rating, 4.5),
      payload.status || "active",
      coerceNumber(payload.current_lat, 36.8065),
      coerceNumber(payload.current_lng, 10.1815),
      nowIso(),
      nowIso()
    ]
  )

  return get("SELECT id, role, full_name, email, phone, governorate, address, vehicle, rating, status, current_lat, current_lng FROM users WHERE id = ?", [result.lastID])
}

export async function updateAppSettings(session, payload) {
  await initializeDatabase()
  if (session.role !== "admin") throw new Error("Seul l'admin peut modifier les parametres")

  const current = await getAppSettings()
  const fields = {
    brand_name: payload.brand_name ?? current.brand_name,
    tagline: payload.tagline ?? current.tagline,
    support_phone: payload.support_phone ?? current.support_phone,
    support_email: payload.support_email ?? current.support_email,
    hero_title: payload.hero_title ?? current.hero_title,
    hero_description: payload.hero_description ?? current.hero_description,
    primary_color: payload.primary_color ?? current.primary_color,
    secondary_color: payload.secondary_color ?? current.secondary_color
  }

  await run(
    `UPDATE app_settings
     SET brand_name = ?, tagline = ?, support_phone = ?, support_email = ?, hero_title = ?, hero_description = ?, primary_color = ?, secondary_color = ?, updated_at = ?
     WHERE id = 1`,
    [
      fields.brand_name,
      fields.tagline,
      fields.support_phone,
      fields.support_email,
      fields.hero_title,
      fields.hero_description,
      fields.primary_color,
      fields.secondary_color,
      nowIso()
    ]
  )

  return getAppSettings()
}

export async function submitDriverApplication(payload) {
  await initializeDatabase()
  const result = await run(
    `INSERT INTO driver_applications (
      full_name, email, phone, governorate, address, vehicle, experience, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      payload.full_name,
      payload.email,
      payload.phone,
      payload.governorate,
      payload.address || "",
      payload.vehicle,
      payload.experience || "",
      payload.notes || "",
      nowIso()
    ]
  )

  return get("SELECT * FROM driver_applications WHERE id = ?", [result.lastID])
}

export async function submitPartnerApplication(payload) {
  await initializeDatabase()
  const result = await run(
    `INSERT INTO partner_applications (
      business_name, contact_name, email, phone, governorate, address, activity, average_shipments, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      payload.business_name,
      payload.contact_name,
      payload.email,
      payload.phone,
      payload.governorate,
      payload.address || "",
      payload.activity || "",
      coerceNumber(payload.average_shipments, 0),
      payload.notes || "",
      nowIso()
    ]
  )

  return get("SELECT * FROM partner_applications WHERE id = ?", [result.lastID])
}

export async function reviewDriverApplication(session, applicationId, nextStatus) {
  await initializeDatabase()
  assertAdminSession(session)

  const status = normalizeApplicationStatus(nextStatus)
  const application = await getDriverApplicationById(applicationId)
  if (!application) throw new Error("Candidature livreur introuvable")

  let whatsappUrl = null
  let linkedUser = null

  if (status === "approved") {
    const onboardingPassword = getOnboardingPassword("driver")
    linkedUser = await upsertApprovedUser(
      "driver",
      {
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        governorate: application.governorate,
        address: application.address || "",
        vehicle: application.vehicle || "",
        rating: 4.5,
        current_lat: 36.8065,
        current_lng: 10.1815
      },
      onboardingPassword
    )
    whatsappUrl = buildApplicationApprovalWhatsappUrl(application, "driver")
  } else {
    linkedUser = await setExistingUserState("driver", application.email, "paused")
  }

  await run("UPDATE driver_applications SET status = ? WHERE id = ?", [status, applicationId])

  return {
    application: await getDriverApplicationById(applicationId),
    linkedUser,
    whatsappUrl
  }
}

export async function reviewPartnerApplication(session, applicationId, nextStatus) {
  await initializeDatabase()
  assertAdminSession(session)

  const status = normalizeApplicationStatus(nextStatus)
  const application = await getPartnerApplicationById(applicationId)
  if (!application) throw new Error("Candidature partenaire introuvable")

  let linkedUser = null

  if (status === "approved") {
    const onboardingPassword = getOnboardingPassword("partner")
    linkedUser = await upsertApprovedUser(
      "partner",
      {
        full_name: application.business_name,
        email: application.email,
        phone: application.phone,
        governorate: application.governorate,
        address: application.address || "",
        vehicle: null,
        rating: 4.5,
        current_lat: 36.8065,
        current_lng: 10.1815
      },
      onboardingPassword
    )
  } else {
    linkedUser = await setExistingUserState("partner", application.email, "paused")
  }

  await run("UPDATE partner_applications SET status = ? WHERE id = ?", [status, applicationId])

  return {
    application: await getPartnerApplicationById(applicationId),
    linkedUser
  }
}

export async function updateUser(session, userId, payload) {
  await initializeDatabase()
  if (session.role !== "admin") throw new Error("Seul l'admin peut modifier un utilisateur")

  const user = await get("SELECT * FROM users WHERE id = ?", [userId])
  if (!user) throw new Error("Utilisateur introuvable")

  const fields = {
    role: payload.role ?? user.role,
    full_name: payload.full_name ?? user.full_name,
    email: payload.email ?? user.email,
    phone: payload.phone ?? user.phone,
    governorate: payload.governorate ?? user.governorate,
    address: payload.address ?? user.address,
    vehicle: payload.vehicle ?? user.vehicle,
    rating: coerceNumber(payload.rating, user.rating),
    status: payload.status ?? user.status,
    current_lat: coerceNumber(payload.current_lat, user.current_lat),
    current_lng: coerceNumber(payload.current_lng, user.current_lng),
    password_hash: payload.password ? hashPassword(payload.password) : user.password_hash
  }

  await run(
    `UPDATE users
     SET role = ?, full_name = ?, email = ?, phone = ?, password_hash = ?, governorate = ?, address = ?, vehicle = ?,
         rating = ?, status = ?, current_lat = ?, current_lng = ?, updated_at = ?
     WHERE id = ?`,
    [
      fields.role,
      fields.full_name,
      fields.email,
      fields.phone,
      fields.password_hash,
      fields.governorate,
      fields.address,
      fields.vehicle,
      fields.rating,
      fields.status,
      fields.current_lat,
      fields.current_lng,
      nowIso(),
      userId
    ]
  )

  return get("SELECT id, role, full_name, email, phone, governorate, address, vehicle, rating, status, current_lat, current_lng FROM users WHERE id = ?", [userId])
}

export async function deleteUser(session, userId) {
  await initializeDatabase()
  if (session.role !== "admin") throw new Error("Seul l'admin peut supprimer un utilisateur")
  if (Number(userId) === Number(session.userId)) throw new Error("Impossible de supprimer la session admin courante")

  await run("DELETE FROM users WHERE id = ?", [userId])
  await run("UPDATE shipments SET driver_id = NULL WHERE driver_id = ?", [userId])
  return { success: true }
}

export async function getUserById(userId) {
  await initializeDatabase()
  return get(
    "SELECT id, role, full_name, email, phone, governorate, address, vehicle, rating, status, current_lat, current_lng FROM users WHERE id = ?",
    [userId]
  )
}
