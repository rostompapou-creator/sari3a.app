"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { STATUS_COLORS, STATUS_STEPS, TRACKING_LABELS } from "../lib/constants"
import { Sari3aLogo } from "./Sari3aLogo"

const TrackingMap = dynamic(() => import("./TrackingMap"), { ssr: false })

const shipmentTemplate = {
  title: "",
  description: "",
  client_id: "",
  partner_id: "",
  driver_id: "",
  status: "pending",
  recipient_name: "",
  recipient_phone: "",
  recipient_address: "",
  governorate: "Tunis",
  city: "Centre Ville",
  package_type: "Standard",
  cod_amount: "0",
  delivery_fee: "8",
  weight: "0.5",
  pickup_lat: "36.8065",
  pickup_lng: "10.1815",
  delivery_lat: "36.8265",
  delivery_lng: "10.2015",
  notes: ""
}

const userTemplate = {
  role: "client",
  full_name: "",
  email: "",
  phone: "",
  governorate: "Tunis",
  address: "",
  vehicle: "",
  rating: "4.5",
  current_lat: "36.8065",
  current_lng: "10.1815",
  status: "active",
  password: "demo123"
}

function money(value) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function statusClass(status) {
  if (STATUS_COLORS[status]) return STATUS_COLORS[status]
  if (String(status).includes("refus") || String(status).includes("cancel")) return "status-rejected"
  if (String(status).includes("report")) return "status-reported"
  return "status-pending"
}

function roleLabel(role) {
  if (role === "driver") return "Livreur"
  if (role === "partner") return "Partenaire"
  if (role === "admin") return "Admin"
  return "Client"
}

function applicationStatusLabel(status) {
  if (status === "approved") return "Validee"
  if (status === "rejected") return "Refusee"
  return "En attente"
}

function applicationStatusClass(status) {
  if (status === "approved") return "application-status-approved"
  if (status === "rejected") return "application-status-rejected"
  return "application-status-pending"
}

function dashboardHeroTitle(role) {
  if (role === "client") return "Vos livraisons en un regard"
  if (role === "driver") return "Votre tournee live"
  if (role === "partner") return "Pilotage partenaire"
  return "Supervision globale"
}

function slugifyStatusLabel(label) {
  return String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function PortalDashboard({ role, initialData }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [shipmentForm, setShipmentForm] = useState(() => ({
    ...shipmentTemplate,
    partner_id: role === "partner" ? String(initialData.user.id) : "",
    client_id: role === "client" ? String(initialData.user.id) : ""
  }))
  const [userForm, setUserForm] = useState(userTemplate)
  const [settingsForm, setSettingsForm] = useState(() => ({
    brand_name: initialData.settings?.brand_name ?? "Sari3a Delivery",
    tagline: initialData.settings?.tagline ?? "Livre vite, livre bien",
    support_phone: initialData.settings?.support_phone ?? "",
    support_email: initialData.settings?.support_email ?? "",
    hero_title: initialData.settings?.hero_title ?? "",
    hero_description: initialData.settings?.hero_description ?? "",
    primary_color: initialData.settings?.primary_color ?? "#081a44",
    secondary_color: initialData.settings?.secondary_color ?? "#d6a328"
  }))
  const [shipmentStatusesForm, setShipmentStatusesForm] = useState(() => initialData.settings?.shipment_statuses ?? [])
  const [newShipmentStatusLabel, setNewShipmentStatusLabel] = useState("")
  const [selectedShipmentId, setSelectedShipmentId] = useState(initialData.shipments[0]?.id ?? null)
  const [editingShipmentId, setEditingShipmentId] = useState(null)
  const [editingUserId, setEditingUserId] = useState(null)
  const [applicationType, setApplicationType] = useState(initialData.driverApplications.length ? "driver" : "partner")
  const [selectedDriverApplicationId, setSelectedDriverApplicationId] = useState(initialData.driverApplications[0]?.id ?? null)
  const [selectedPartnerApplicationId, setSelectedPartnerApplicationId] = useState(initialData.partnerApplications[0]?.id ?? null)
  const [shipmentFilter, setShipmentFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busyAction, setBusyAction] = useState("")

  const shipmentStatuses = data.statuses?.length ? data.statuses : STATUS_STEPS
  const progressStatuses = shipmentStatuses.filter((status) => status.type !== "manual")
  const statusLabels = useMemo(
    () => Object.fromEntries(shipmentStatuses.map((status) => [status.key, status.label])),
    [shipmentStatuses]
  )

  const filteredShipments = useMemo(() => {
    return data.shipments.filter((shipment) => {
      const matchesText =
        !shipmentFilter ||
        [shipment.tracking_number, shipment.title, shipment.recipient_name, shipment.partner_name, shipment.driver_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(shipmentFilter.toLowerCase())

      const matchesStatus = statusFilter === "all" || shipment.status === statusFilter
      return matchesText && matchesStatus
    })
  }, [data.shipments, shipmentFilter, statusFilter])

  const getNextStatusLabel = (status) => {
    const index = progressStatuses.findIndex((step) => step.key === status)
    return progressStatuses[index + 1]?.label ?? null
  }

  const selectedShipment =
    filteredShipments.find((shipment) => shipment.id === selectedShipmentId) ??
    data.shipments.find((shipment) => shipment.id === selectedShipmentId) ??
    filteredShipments[0] ??
    data.shipments[0] ??
    null

  const pendingDriverApplications = useMemo(
    () => data.driverApplications.filter((application) => application.status === "pending"),
    [data.driverApplications]
  )

  const pendingPartnerApplications = useMemo(
    () => data.partnerApplications.filter((application) => application.status === "pending"),
    [data.partnerApplications]
  )
  const partnerFinancialRows = data.financials?.byPartner ?? []
  const driverFinancialRows = data.financials?.byDriver ?? []

  const selectedDriverApplication =
    data.driverApplications.find((application) => application.id === selectedDriverApplicationId) ??
    pendingDriverApplications[0] ??
    data.driverApplications[0] ??
    null

  const selectedPartnerApplication =
    data.partnerApplications.find((application) => application.id === selectedPartnerApplicationId) ??
    pendingPartnerApplications[0] ??
    data.partnerApplications[0] ??
    null

  const activeApplications = applicationType === "driver" ? data.driverApplications : data.partnerApplications
  const selectedApplication = applicationType === "driver" ? selectedDriverApplication : selectedPartnerApplication

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      ...options
    })
    const body = response.status === 204 ? null : await response.json()
    if (!response.ok) throw new Error(body?.message || "Operation impossible")
    return body
  }

  async function refreshDashboard() {
    const nextData = await api("/api/dashboard")
    setData(nextData)
    if (nextData.shipments.length && !nextData.shipments.find((shipment) => shipment.id === selectedShipmentId)) {
      setSelectedShipmentId(nextData.shipments[0].id)
    }
  }

  function resetShipmentForm() {
    setEditingShipmentId(null)
    setShipmentForm({
      ...shipmentTemplate,
      partner_id: role === "partner" ? String(data.user.id) : "",
      client_id: role === "client" ? String(data.user.id) : "",
      status: "pending",
      recipient_name: role === "client" ? data.user.full_name : "",
      recipient_phone: role === "client" ? data.user.phone ?? "" : "",
      recipient_address: role === "client" ? data.user.address ?? "" : "",
      governorate: data.user.governorate ?? "Tunis"
    })
  }

  function resetUserForm() {
    setEditingUserId(null)
    setUserForm(userTemplate)
  }

  async function handleShipmentSubmit(event) {
    event.preventDefault()
    setBusyAction("shipment")
    setMessage("")
    setError("")

    try {
      let result
      if (editingShipmentId) {
        result = await api(`/api/shipments/${editingShipmentId}`, {
          method: "PATCH",
          body: JSON.stringify(shipmentForm)
        })
        setMessage("Colis mis a jour.")
      } else {
        result = await api("/api/shipments", {
          method: "POST",
          body: JSON.stringify(shipmentForm)
        })
        setMessage("Colis cree avec succes.")
      }

      if (result?.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer")
        setMessage("Colis enregistre et message WhatsApp prepare pour le livreur.")
      }

      await refreshDashboard()
      resetShipmentForm()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusyAction("")
    }
  }

  async function handleDeleteShipment(id) {
    if (!window.confirm("Supprimer ce colis ?")) return
    setBusyAction(`delete-${id}`)
    setError("")
    try {
      await api(`/api/shipments/${id}`, { method: "DELETE" })
      setMessage("Colis supprime.")
      await refreshDashboard()
      if (editingShipmentId === id) resetShipmentForm()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBusyAction("")
    }
  }

  async function handleAdvanceStatus(id) {
    setBusyAction(`status-${id}`)
    setError("")
    try {
      await api(`/api/shipments/${id}/status`, { method: "POST" })
      setMessage("Statut mis a jour.")
      await refreshDashboard()
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setBusyAction("")
    }
  }

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setBusyAction("profile")
    setError("")

    try {
      await api("/api/driver/profile", { method: "PATCH", body: JSON.stringify(userForm) })
      await refreshDashboard()
      setMessage("Profil livreur actualise.")
    } catch (profileError) {
      setError(profileError.message)
    } finally {
      setBusyAction("")
    }
  }

  async function handleUserSubmit(event) {
    event.preventDefault()
    setBusyAction("user")
    setError("")

    try {
      if (editingUserId) {
        await api(`/api/users/${editingUserId}`, { method: "PATCH", body: JSON.stringify(userForm) })
        setMessage("Utilisateur mis a jour.")
      } else {
        await api("/api/users", { method: "POST", body: JSON.stringify(userForm) })
        setMessage("Utilisateur cree.")
      }
      await refreshDashboard()
      resetUserForm()
    } catch (userError) {
      setError(userError.message)
    } finally {
      setBusyAction("")
    }
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault()
    setBusyAction("settings")
    setError("")

    try {
      const updated = await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          ...settingsForm,
          shipment_statuses: shipmentStatusesForm
        })
      })
      setSettingsForm({
        brand_name: updated.brand_name,
        tagline: updated.tagline,
        support_phone: updated.support_phone,
        support_email: updated.support_email,
        hero_title: updated.hero_title,
        hero_description: updated.hero_description,
        primary_color: updated.primary_color,
        secondary_color: updated.secondary_color
      })
      setShipmentStatusesForm(updated.shipment_statuses ?? [])
      await refreshDashboard()
      setMessage("Parametres et statuts colis mis a jour.")
    } catch (settingsError) {
      setError(settingsError.message)
    } finally {
      setBusyAction("")
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm("Supprimer cet utilisateur ?")) return
    setBusyAction(`user-delete-${id}`)
    setError("")
    try {
      await api(`/api/users/${id}`, { method: "DELETE" })
      setMessage("Utilisateur supprime.")
      await refreshDashboard()
      if (editingUserId === id) resetUserForm()
    } catch (userError) {
      setError(userError.message)
    } finally {
      setBusyAction("")
    }
  }

  function handleAddShipmentStatus() {
    const label = newShipmentStatusLabel.trim()
    const key = slugifyStatusLabel(label)
    if (!label || !key) return
    if (shipmentStatusesForm.some((status) => status.key === key) || shipmentStatuses.some((status) => status.key === key)) {
      setError("Ce statut existe deja.")
      return
    }

    setShipmentStatusesForm((current) => [...current, { key, label }])
    setNewShipmentStatusLabel("")
    setError("")
  }

  function handleShipmentStatusLabelChange(index, label) {
    setShipmentStatusesForm((current) =>
      current.map((status, itemIndex) =>
        itemIndex === index
          ? {
              key: slugifyStatusLabel(label),
              label
            }
          : status
      )
    )
  }

  function handleRemoveShipmentStatus(index) {
    setShipmentStatusesForm((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function handleApplicationDecision(type, id, status) {
    setBusyAction(`application-${type}-${id}-${status}`)
    setError("")

    try {
      const result = await api(`/api/applications/${type}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })

      await refreshDashboard()

      if (type === "driver") {
        setSelectedDriverApplicationId(result.application?.id ?? id)
      } else {
        setSelectedPartnerApplicationId(result.application?.id ?? id)
      }

      if (type === "driver" && status === "approved" && result?.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer")
        setMessage("Candidature livreur validee et message WhatsApp prepare.")
        return
      }

      setMessage(`Candidature ${type === "driver" ? "livreur" : "partenaire"} mise a jour.`)
    } catch (applicationError) {
      setError(applicationError.message)
    } finally {
      setBusyAction("")
    }
  }

  function loadShipmentForEdit(shipment) {
    setEditingShipmentId(shipment.id)
    setSelectedShipmentId(shipment.id)
    setShipmentForm({
      title: shipment.title ?? "",
      description: shipment.description ?? "",
      client_id: String(shipment.client_id ?? ""),
      partner_id: String(shipment.partner_id ?? ""),
      driver_id: shipment.driver_id ? String(shipment.driver_id) : "",
      status: shipment.status ?? "pending",
      recipient_name: shipment.recipient_name ?? "",
      recipient_phone: shipment.recipient_phone ?? "",
      recipient_address: shipment.recipient_address ?? "",
      governorate: shipment.governorate ?? "Tunis",
      city: shipment.city ?? "",
      package_type: shipment.package_type ?? "Standard",
      cod_amount: String(shipment.cod_amount ?? "0"),
      delivery_fee: String(shipment.delivery_fee ?? "8"),
      weight: String(shipment.weight ?? "0.5"),
      pickup_lat: String(shipment.pickup_lat ?? ""),
      pickup_lng: String(shipment.pickup_lng ?? ""),
      delivery_lat: String(shipment.delivery_lat ?? ""),
      delivery_lng: String(shipment.delivery_lng ?? ""),
      notes: shipment.notes ?? ""
    })
  }

  function loadUserForEdit(user) {
    setEditingUserId(user.id)
    setUserForm({
      role: user.role,
      full_name: user.full_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      governorate: user.governorate ?? "Tunis",
      address: user.address ?? "",
      vehicle: user.vehicle ?? "",
      rating: String(user.rating ?? 4.5),
      current_lat: String(user.current_lat ?? 36.8065),
      current_lng: String(user.current_lng ?? 10.1815),
      status: user.status ?? "active",
      password: ""
    })
  }

  const managedUsers = [...data.clients, ...data.drivers, ...data.partners, ...data.admins]
  const dashboardShipments = filteredShipments.length ? filteredShipments : data.shipments

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div className="dashboard-hero-top">
          <Sari3aLogo compact />
          <div className="hero-user-meta">
            <span className="role-badge">{roleLabel(role)}</span>
            <strong>{data.user.full_name}</strong>
            <span>{data.user.governorate}</span>
          </div>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Deconnexion
          </button>
        </div>

        <div className="hero-copy">
          <div>
            <p className="eyebrow">Centre de commandement Sari3a</p>
            <h1 className={role === "client" || role === "driver" ? "dashboard-hero-title dashboard-hero-title-unified" : "dashboard-hero-title"}>
              {dashboardHeroTitle(role)}
            </h1>
            <p>Base libSQL/Turso, suivi GPS Leaflet, timeline temps reel et actions rapides adaptees a votre portail.</p>
          </div>
          <div className="stats-grid">
            <article className="stat-card">
              <span>Colis</span>
              <strong>{data.stats.total}</strong>
            </article>
            <article className="stat-card">
              <span>En mouvement</span>
              <strong>{data.stats.inMotion}</strong>
            </article>
            <article className="stat-card">
              <span>Livres</span>
              <strong>{data.stats.delivered}</strong>
            </article>
            <article className="stat-card">
              <span>COD en attente</span>
              <strong>{money(data.stats.codPending)} DT</strong>
            </article>
          </div>
        </div>
      </section>

      {message ? <p className="flash-message success">{message}</p> : null}
      {error ? <p className="flash-message error">{error}</p> : null}

      <section className="dashboard-main-grid">
        <div className="panel glass-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Tracking</p>
              <h2>Colis & statuts</h2>
            </div>
            <div className="toolbar">
              <input placeholder="Tracking, client, titre..." value={shipmentFilter} onChange={(event) => setShipmentFilter(event.target.value)} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous les statuts</option>
                {shipmentStatuses.map((step) => (
                  <option key={step.key} value={step.key}>
                    {step.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="shipment-list">
            {dashboardShipments.map((shipment) => (
              <article key={shipment.id} className={`shipment-card ${selectedShipment?.id === shipment.id ? "selected" : ""}`} onClick={() => setSelectedShipmentId(shipment.id)}>
                <div className="shipment-card-top">
                  <div>
                    <strong>{shipment.tracking_number}</strong>
                    <h3>{shipment.title}</h3>
                  </div>
                  <span className={`status-pill ${statusClass(shipment.status)}`}>{statusLabels[shipment.status] ?? TRACKING_LABELS[shipment.status] ?? shipment.status}</span>
                </div>
                <p>{shipment.recipient_name} · {shipment.governorate}</p>
                <p>{shipment.partner_name ?? "Partenaire non affecte"} · {shipment.driver_name ?? "Livreur a assigner"}</p>
                <div className="shipment-actions">
                  {(role === "partner" || role === "admin" || (role === "client" && ["pending", "picked_up"].includes(shipment.status))) ? (
                    <button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); loadShipmentForEdit(shipment) }}>
                      Modifier
                    </button>
                  ) : null}
                  {(role === "driver" || role === "partner" || role === "admin") && getNextStatusLabel(shipment.status) ? (
                    <button type="button" className="primary-button" disabled={busyAction === `status-${shipment.id}`} onClick={(event) => { event.stopPropagation(); handleAdvanceStatus(shipment.id) }}>
                      {getNextStatusLabel(shipment.status)}
                    </button>
                  ) : null}
                  {(role === "partner" || role === "admin" || role === "client") ? (
                    <button type="button" className="ghost-button" disabled={busyAction === `delete-${shipment.id}`} onClick={(event) => { event.stopPropagation(); handleDeleteShipment(shipment.id) }}>
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel glass-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Suivi GPS</p>
              <h2>Carte Live</h2>
            </div>
          </div>
          <TrackingMap shipments={dashboardShipments} drivers={data.drivers} selectedShipmentId={selectedShipment?.id ?? null} />
        </div>
      </section>

      <section className="dashboard-secondary-grid">
        <div className="panel glass-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Chronologie</p>
              <h2>Timeline du colis</h2>
            </div>
            {selectedShipment ? <span className={`status-pill ${statusClass(selectedShipment.status)}`}>{selectedShipment.tracking_number}</span> : null}
          </div>

          {selectedShipment ? (
            <>
              <div className="timeline-progress">
                {progressStatuses.map((step) => {
                  const currentIndex = progressStatuses.findIndex((item) => item.key === selectedShipment.status)
                  const stepIndex = progressStatuses.findIndex((item) => item.key === step.key)
                  const completed = stepIndex <= currentIndex
                  return (
                    <div key={step.key} className={`timeline-step ${completed ? "completed" : ""}`}>
                      <span />
                      <strong>{step.label}</strong>
                    </div>
                  )
                })}
              </div>
              <div className="event-list">
                {selectedShipment.events.map((event) => (
                  <article key={event.id} className="event-item">
                    <strong>{event.label}</strong>
                    <p>{event.description}</p>
                    <span>{new Date(event.created_at).toLocaleString("fr-FR")}</span>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p>Aucun colis selectionne.</p>
          )}
        </div>

        {(role === "client" || role === "partner" || role === "admin") ? (
          <div className="panel glass-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{editingShipmentId ? "Edition" : "Creation"}</p>
                <h2>{role === "client" ? "Demande de livraison" : "CRUD colis"}</h2>
              </div>
              {editingShipmentId ? (
                <button type="button" className="secondary-button" onClick={resetShipmentForm}>
                  Nouveau
                </button>
              ) : null}
            </div>

            <form className="stack-form dense" onSubmit={handleShipmentSubmit}>
              <div className="grid-two">
                <label>
                  Titre
                  <input value={shipmentForm.title} onChange={(event) => setShipmentForm((current) => ({ ...current, title: event.target.value }))} required />
                </label>
                <label>
                  Type
                  <input value={shipmentForm.package_type} onChange={(event) => setShipmentForm((current) => ({ ...current, package_type: event.target.value }))} />
                </label>
              </div>
              <label>
                Description
                <textarea rows="2" value={shipmentForm.description} onChange={(event) => setShipmentForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <div className="grid-two">
                {role === "admin" ? (
                  <label>
                    Partenaire
                    <select value={shipmentForm.partner_id} onChange={(event) => setShipmentForm((current) => ({ ...current, partner_id: event.target.value }))} required>
                      <option value="">Choisir</option>
                      {data.partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>{partner.full_name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {(role === "partner" || role === "admin") ? (
                  <label>
                    Client
                    <select value={shipmentForm.client_id} onChange={(event) => setShipmentForm((current) => ({ ...current, client_id: event.target.value }))} required>
                      <option value="">Choisir</option>
                      {data.clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.full_name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <div className="grid-two">
                {(role === "partner" || role === "admin") ? (
                  <label>
                    Livreur
                    <select value={shipmentForm.driver_id} onChange={(event) => setShipmentForm((current) => ({ ...current, driver_id: event.target.value }))}>
                      <option value="">Aucun</option>
                      {data.drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {(role === "partner" || role === "admin") ? (
                  <label>
                    Statut
                    <select value={shipmentForm.status} onChange={(event) => setShipmentForm((current) => ({ ...current, status: event.target.value }))}>
                      {shipmentStatuses.map((status) => (
                        <option key={status.key} value={status.key}>{status.label}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    Gouvernorat
                    <select value={shipmentForm.governorate} onChange={(event) => setShipmentForm((current) => ({ ...current, governorate: event.target.value }))}>
                      {data.governorates.map((governorate) => (
                        <option key={governorate} value={governorate}>{governorate}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <div className="grid-two">
                <label>
                  Gouvernorat
                  <select value={shipmentForm.governorate} onChange={(event) => setShipmentForm((current) => ({ ...current, governorate: event.target.value }))}>
                    {data.governorates.map((governorate) => (
                      <option key={governorate} value={governorate}>{governorate}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Ville / zone
                  <input value={shipmentForm.city} onChange={(event) => setShipmentForm((current) => ({ ...current, city: event.target.value }))} />
                </label>
              </div>
              <div className="grid-two">
                <label>
                  Destinataire
                  <input value={shipmentForm.recipient_name} onChange={(event) => setShipmentForm((current) => ({ ...current, recipient_name: event.target.value }))} required />
                </label>
                <label>
                  Telephone
                  <input value={shipmentForm.recipient_phone} onChange={(event) => setShipmentForm((current) => ({ ...current, recipient_phone: event.target.value }))} required />
                </label>
              </div>
              <label>
                Adresse
                <input value={shipmentForm.recipient_address} onChange={(event) => setShipmentForm((current) => ({ ...current, recipient_address: event.target.value }))} required />
              </label>
              <div className="grid-three">
                <label>
                  COD
                  <input type="number" step="0.01" value={shipmentForm.cod_amount} onChange={(event) => setShipmentForm((current) => ({ ...current, cod_amount: event.target.value }))} />
                </label>
                <label>
                  Frais
                  <input type="number" step="0.01" value={shipmentForm.delivery_fee} onChange={(event) => setShipmentForm((current) => ({ ...current, delivery_fee: event.target.value }))} />
                </label>
                <label>
                  Poids
                  <input type="number" step="0.1" value={shipmentForm.weight} onChange={(event) => setShipmentForm((current) => ({ ...current, weight: event.target.value }))} />
                </label>
              </div>
              <div className="grid-two">
                <label>
                  Pickup lat/lng
                  <div className="inline-pair">
                    <input value={shipmentForm.pickup_lat} onChange={(event) => setShipmentForm((current) => ({ ...current, pickup_lat: event.target.value }))} />
                    <input value={shipmentForm.pickup_lng} onChange={(event) => setShipmentForm((current) => ({ ...current, pickup_lng: event.target.value }))} />
                  </div>
                </label>
                <label>
                  Livraison lat/lng
                  <div className="inline-pair">
                    <input value={shipmentForm.delivery_lat} onChange={(event) => setShipmentForm((current) => ({ ...current, delivery_lat: event.target.value }))} />
                    <input value={shipmentForm.delivery_lng} onChange={(event) => setShipmentForm((current) => ({ ...current, delivery_lng: event.target.value }))} />
                  </div>
                </label>
              </div>
              <label>
                Notes
                <textarea rows="2" value={shipmentForm.notes} onChange={(event) => setShipmentForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
              <button type="submit" className="primary-button" disabled={busyAction === "shipment"}>
                {busyAction === "shipment" ? "Enregistrement..." : editingShipmentId ? "Mettre a jour le colis" : "Creer le colis"}
              </button>
            </form>
          </div>
        ) : (
          <div className="panel glass-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Profil</p>
                <h2>Fiche livreur</h2>
              </div>
            </div>

            <form className="stack-form dense" onSubmit={handleProfileSubmit}>
              <div className="grid-two">
                <label>
                  Telephone
                  <input defaultValue={data.user.phone ?? ""} onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label>
                  Vehicule
                  <input defaultValue={data.user.vehicle ?? ""} onChange={(event) => setUserForm((current) => ({ ...current, vehicle: event.target.value }))} />
                </label>
              </div>
              <div className="grid-two">
                <label>
                  Gouvernorat
                  <select defaultValue={data.user.governorate ?? "Tunis"} onChange={(event) => setUserForm((current) => ({ ...current, governorate: event.target.value }))}>
                    {data.governorates.map((governorate) => (
                      <option key={governorate} value={governorate}>{governorate}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Adresse
                  <input defaultValue={data.user.address ?? ""} onChange={(event) => setUserForm((current) => ({ ...current, address: event.target.value }))} />
                </label>
              </div>
              <div className="grid-two">
                <label>
                  Latitude GPS
                  <input defaultValue={String(data.user.current_lat ?? "")} onChange={(event) => setUserForm((current) => ({ ...current, current_lat: event.target.value }))} />
                </label>
                <label>
                  Longitude GPS
                  <input defaultValue={String(data.user.current_lng ?? "")} onChange={(event) => setUserForm((current) => ({ ...current, current_lng: event.target.value }))} />
                </label>
              </div>
              <button type="submit" className="primary-button" disabled={busyAction === "profile"}>
                {busyAction === "profile" ? "Mise a jour..." : "Mettre a jour ma position et mon profil"}
              </button>
            </form>

            <div className="profile-summary">
              <article>
                <strong>Note</strong>
                <span>{Number(data.user.rating ?? 0).toFixed(1)} / 5</span>
              </article>
              <article>
                <strong>Vehicule</strong>
                <span>{data.user.vehicle}</span>
              </article>
            </div>
          </div>
        )}
      </section>

      {(role === "partner" || role === "admin") ? (
        <section className="dashboard-secondary-grid">
          <div className="panel glass-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Livreurs</p>
                <h2>Gestion & affectation</h2>
              </div>
            </div>
            <div className="mini-grid">
              {data.drivers.map((driver) => (
                <article key={driver.id} className="mini-card">
                  <strong>{driver.full_name}</strong>
                  <p>{driver.vehicle}</p>
                  <span>{driver.governorate} · {Number(driver.rating).toFixed(1)} / 5</span>
                </article>
              ))}
            </div>
          </div>

          {role === "admin" ? (
            <div className="panel glass-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Utilisateurs</p>
                  <h2>CRUD multi-portails</h2>
                </div>
                {editingUserId ? (
                  <button type="button" className="secondary-button" onClick={resetUserForm}>
                    Nouveau
                  </button>
                ) : null}
              </div>

              <form className="stack-form dense" onSubmit={handleUserSubmit}>
                <div className="grid-two">
                  <label>
                    Role
                    <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}>
                      <option value="client">Client</option>
                      <option value="driver">Livreur</option>
                      <option value="partner">Partenaire</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label>
                    Nom complet
                    <input value={userForm.full_name} onChange={(event) => setUserForm((current) => ({ ...current, full_name: event.target.value }))} required />
                  </label>
                </div>
                <div className="grid-two">
                  <label>
                    Email
                    <input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} required />
                  </label>
                  <label>
                    Telephone
                    <input value={userForm.phone} onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))} />
                  </label>
                </div>
                <div className="grid-two">
                  <label>
                    Gouvernorat
                    <select value={userForm.governorate} onChange={(event) => setUserForm((current) => ({ ...current, governorate: event.target.value }))}>
                      {data.governorates.map((governorate) => (
                        <option key={governorate} value={governorate}>{governorate}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Statut
                    <select value={userForm.status} onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="active">Actif</option>
                      <option value="paused">Pause</option>
                    </select>
                  </label>
                </div>
                <div className="grid-two">
                  <label>
                    Adresse
                    <input value={userForm.address} onChange={(event) => setUserForm((current) => ({ ...current, address: event.target.value }))} />
                  </label>
                  <label>
                    Vehicule
                    <input value={userForm.vehicle} onChange={(event) => setUserForm((current) => ({ ...current, vehicle: event.target.value }))} />
                  </label>
                </div>
                <div className="grid-three">
                  <label>
                    Note
                    <input type="number" step="0.1" value={userForm.rating} onChange={(event) => setUserForm((current) => ({ ...current, rating: event.target.value }))} />
                  </label>
                  <label>
                    Latitude
                    <input value={userForm.current_lat} onChange={(event) => setUserForm((current) => ({ ...current, current_lat: event.target.value }))} />
                  </label>
                  <label>
                    Longitude
                    <input value={userForm.current_lng} onChange={(event) => setUserForm((current) => ({ ...current, current_lng: event.target.value }))} />
                  </label>
                </div>
                <label>
                  Mot de passe
                  <input value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} placeholder={editingUserId ? "Laisser vide pour conserver" : "demo123"} />
                </label>
                <button type="submit" className="primary-button" disabled={busyAction === "user"}>
                  {busyAction === "user" ? "Enregistrement..." : editingUserId ? "Mettre a jour l'utilisateur" : "Creer l'utilisateur"}
                </button>
              </form>

              <div className="user-list">
                {managedUsers.map((user) => (
                  <article key={user.id} className="mini-card actions">
                    <div>
                      <strong>{user.full_name}</strong>
                      <p>{roleLabel(user.role)} · {user.email}</p>
                    </div>
                    <div className="shipment-actions">
                      <button type="button" className="secondary-button" onClick={() => loadUserForEdit(user)}>Modifier</button>
                      <button type="button" className="ghost-button" disabled={busyAction === `user-delete-${user.id}`} onClick={() => handleDeleteUser(user.id)}>Supprimer</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="settings-block">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Parametres</p>
                    <h2>Branding & accueil</h2>
                  </div>
                </div>

                <form className="stack-form dense" onSubmit={handleSettingsSubmit}>
                  <div className="grid-two">
                    <label>
                      Nom de marque
                      <input value={settingsForm.brand_name} onChange={(event) => setSettingsForm((current) => ({ ...current, brand_name: event.target.value }))} />
                    </label>
                    <label>
                      Tagline
                      <input value={settingsForm.tagline} onChange={(event) => setSettingsForm((current) => ({ ...current, tagline: event.target.value }))} />
                    </label>
                  </div>
                  <div className="grid-two">
                    <label>
                      Telephone support
                      <input value={settingsForm.support_phone} onChange={(event) => setSettingsForm((current) => ({ ...current, support_phone: event.target.value }))} />
                    </label>
                    <label>
                      Email support
                      <input value={settingsForm.support_email} onChange={(event) => setSettingsForm((current) => ({ ...current, support_email: event.target.value }))} />
                    </label>
                  </div>
                  <label>
                    Titre hero
                    <input value={settingsForm.hero_title} onChange={(event) => setSettingsForm((current) => ({ ...current, hero_title: event.target.value }))} />
                  </label>
                  <label>
                    Description hero
                    <textarea rows="3" value={settingsForm.hero_description} onChange={(event) => setSettingsForm((current) => ({ ...current, hero_description: event.target.value }))} />
                  </label>
                  <div className="grid-two">
                    <label>
                      Couleur primaire
                      <input value={settingsForm.primary_color} onChange={(event) => setSettingsForm((current) => ({ ...current, primary_color: event.target.value }))} />
                    </label>
                    <label>
                      Couleur secondaire
                      <input value={settingsForm.secondary_color} onChange={(event) => setSettingsForm((current) => ({ ...current, secondary_color: event.target.value }))} />
                    </label>
                  </div>
                  <button type="submit" className="primary-button" disabled={busyAction === "settings"}>
                    {busyAction === "settings" ? "Mise a jour..." : "Enregistrer les parametres"}
                  </button>
                </form>

                <div className="settings-block">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Colis</p>
                      <h2>Statuts personnalisables</h2>
                    </div>
                  </div>

                  <div className="shipment-status-config">
                    <div className="mini-card">
                      <strong>Parcours standard</strong>
                      <div className="status-pill-list">
                        {progressStatuses.map((status) => (
                          <span key={status.key} className={`status-pill ${statusClass(status.key)}`}>
                            {status.label}
                          </span>
                        ))}
                      </div>
                      <span>Ces etapes restent la base de la timeline et du suivi transport.</span>
                    </div>

                    <div className="mini-card">
                      <strong>Statuts additionnels</strong>
                      <span>Ajoutez des cas metier comme Refuse, Reporte ou Retour depot, puis enregistrez les parametres.</span>

                      <div className="shipment-status-editor">
                        {shipmentStatusesForm.length ? shipmentStatusesForm.map((status, index) => (
                          <div key={`${status.key}-${index}`} className="shipment-status-row">
                            <input
                              value={status.label}
                              placeholder="Nom du statut"
                              onChange={(event) => handleShipmentStatusLabelChange(index, event.target.value)}
                            />
                            <span className="shipment-status-key">{slugifyStatusLabel(status.label) || "cle_auto"}</span>
                            <button type="button" className="ghost-button" onClick={() => handleRemoveShipmentStatus(index)}>
                              Supprimer
                            </button>
                          </div>
                        )) : (
                          <span>Aucun statut additionnel configure pour le moment.</span>
                        )}
                      </div>

                      <div className="shipment-status-add">
                        <input
                          value={newShipmentStatusLabel}
                          placeholder='Ex: Refuse ou Reporte'
                          onChange={(event) => setNewShipmentStatusLabel(event.target.value)}
                        />
                        <button type="button" className="secondary-button" onClick={handleAddShipmentStatus}>
                          Ajouter un statut
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-block">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">KPI montants</p>
                      <h2>Totaux des livraisons</h2>
                    </div>
                  </div>

                  <div className="analytics-grid finance-kpi-grid">
                    <article className="mini-card">
                      <strong>{money(data.financials?.totalAmount)} DT</strong>
                      <span>Total cumule des frais de livraison</span>
                    </article>
                    <article className="mini-card">
                      <strong>{partnerFinancialRows.length}</strong>
                      <span>Partenaires avec montant comptabilise</span>
                    </article>
                    <article className="mini-card">
                      <strong>{driverFinancialRows.length}</strong>
                      <span>Livreurs avec montant comptabilise</span>
                    </article>
                  </div>

                  <div className="finance-breakdown-grid">
                    <article className="mini-card finance-breakdown-card">
                      <strong>Montants par partenaire</strong>
                      <div className="finance-breakdown-list">
                        {partnerFinancialRows.length ? partnerFinancialRows.map((item) => (
                          <div key={item.id} className="finance-breakdown-row">
                            <div>
                              <span>{item.name}</span>
                              <small>{item.shipments} colis</small>
                            </div>
                            <strong>{money(item.amount)} DT</strong>
                          </div>
                        )) : <span>Aucun montant partenaire calcule pour le moment.</span>}
                      </div>
                    </article>

                    <article className="mini-card finance-breakdown-card">
                      <strong>Montants par livreur</strong>
                      <div className="finance-breakdown-list">
                        {driverFinancialRows.length ? driverFinancialRows.map((item) => (
                          <div key={item.id} className="finance-breakdown-row">
                            <div>
                              <span>{item.name}</span>
                              <small>{item.shipments} colis</small>
                            </div>
                            <strong>{money(item.amount)} DT</strong>
                          </div>
                        )) : <span>Aucun montant livreur calcule pour le moment.</span>}
                      </div>
                    </article>
                  </div>
                </div>

                <div className="applications-grid">
                  <article className="mini-card">
                    <strong>Livreurs en attente de validation</strong>
                    <p>{pendingDriverApplications.length} candidature(s) en attente</p>
                    {pendingDriverApplications.length ? pendingDriverApplications.slice(0, 5).map((application) => (
                      <span key={application.id}>{application.full_name} · {application.governorate}</span>
                    )) : <span>Aucune candidature en attente</span>}
                  </article>
                  <article className="mini-card">
                    <strong>Partenaires en attente de validation</strong>
                    <p>{pendingPartnerApplications.length} candidature(s) en attente</p>
                    {pendingPartnerApplications.length ? pendingPartnerApplications.slice(0, 5).map((application) => (
                      <span key={application.id}>{application.business_name} · {application.governorate}</span>
                    )) : <span>Aucune candidature en attente</span>}
                  </article>
                </div>

                <div className="settings-block">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Validation</p>
                      <h2>Candidatures publiques</h2>
                    </div>
                  </div>

                  <div className="application-switcher">
                    <button
                      type="button"
                      className={`secondary-button ${applicationType === "driver" ? "is-active" : ""}`}
                      onClick={() => setApplicationType("driver")}
                    >
                      Livreurs ({pendingDriverApplications.length} en attente)
                    </button>
                    <button
                      type="button"
                      className={`secondary-button ${applicationType === "partner" ? "is-active" : ""}`}
                      onClick={() => setApplicationType("partner")}
                    >
                      Partenaires ({pendingPartnerApplications.length} en attente)
                    </button>
                  </div>

                  <div className="application-review-grid">
                    <div className="application-review-list">
                      {activeApplications.length ? activeApplications.map((application) => {
                        const isDriver = applicationType === "driver"
                        const isSelected = selectedApplication?.id === application.id
                        const title = isDriver ? application.full_name : application.business_name
                        const subtitle = isDriver ? application.vehicle : application.contact_name

                        return (
                          <button
                            key={application.id}
                            type="button"
                            className={`application-summary-card ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (isDriver) setSelectedDriverApplicationId(application.id)
                              else setSelectedPartnerApplicationId(application.id)
                            }}
                          >
                            <div className="application-summary-top">
                              <strong>{title}</strong>
                              <span className={`application-status ${applicationStatusClass(application.status)}`}>
                                {applicationStatusLabel(application.status)}
                              </span>
                            </div>
                            <span>{application.governorate}</span>
                            <span>{subtitle || application.email}</span>
                            <span>{new Date(application.created_at).toLocaleString("fr-FR")}</span>
                          </button>
                        )
                      }) : (
                        <div className="mini-card">
                          <strong>Aucune candidature</strong>
                          <span>Les nouvelles demandes apparaitront ici.</span>
                        </div>
                      )}
                    </div>

                    <div className="application-detail-card">
                      {selectedApplication ? (
                        <>
                          <div className="application-detail-header">
                            <div>
                              <p className="eyebrow">Fiche candidate</p>
                              <h3>{applicationType === "driver" ? selectedApplication.full_name : selectedApplication.business_name}</h3>
                            </div>
                            <span className={`application-status ${applicationStatusClass(selectedApplication.status)}`}>
                              {applicationStatusLabel(selectedApplication.status)}
                            </span>
                          </div>

                          <div className="application-detail-grid">
                            {applicationType === "driver" ? (
                              <>
                                <article>
                                  <span>Nom complet</span>
                                  <strong>{selectedApplication.full_name}</strong>
                                </article>
                                <article>
                                  <span>Email</span>
                                  <strong>{selectedApplication.email}</strong>
                                </article>
                                <article>
                                  <span>Telephone</span>
                                  <strong>{selectedApplication.phone}</strong>
                                </article>
                                <article>
                                  <span>Gouvernorat</span>
                                  <strong>{selectedApplication.governorate}</strong>
                                </article>
                                <article>
                                  <span>Adresse</span>
                                  <strong>{selectedApplication.address || "-"}</strong>
                                </article>
                                <article>
                                  <span>Vehicule</span>
                                  <strong>{selectedApplication.vehicle}</strong>
                                </article>
                                <article>
                                  <span>Experience</span>
                                  <strong>{selectedApplication.experience || "-"}</strong>
                                </article>
                                <article>
                                  <span>Date d'envoi</span>
                                  <strong>{new Date(selectedApplication.created_at).toLocaleString("fr-FR")}</strong>
                                </article>
                                <article className="application-detail-wide">
                                  <span>Notes</span>
                                  <strong>{selectedApplication.notes || "-"}</strong>
                                </article>
                              </>
                            ) : (
                              <>
                                <article>
                                  <span>Entreprise</span>
                                  <strong>{selectedApplication.business_name}</strong>
                                </article>
                                <article>
                                  <span>Contact</span>
                                  <strong>{selectedApplication.contact_name}</strong>
                                </article>
                                <article>
                                  <span>Email</span>
                                  <strong>{selectedApplication.email}</strong>
                                </article>
                                <article>
                                  <span>Telephone</span>
                                  <strong>{selectedApplication.phone}</strong>
                                </article>
                                <article>
                                  <span>Gouvernorat</span>
                                  <strong>{selectedApplication.governorate}</strong>
                                </article>
                                <article>
                                  <span>Adresse</span>
                                  <strong>{selectedApplication.address || "-"}</strong>
                                </article>
                                <article>
                                  <span>Activite</span>
                                  <strong>{selectedApplication.activity || "-"}</strong>
                                </article>
                                <article>
                                  <span>Colis / jour</span>
                                  <strong>{selectedApplication.average_shipments}</strong>
                                </article>
                                <article className="application-detail-wide">
                                  <span>Notes</span>
                                  <strong>{selectedApplication.notes || "-"}</strong>
                                </article>
                              </>
                            )}
                          </div>

                          <div className="application-actions-row">
                            <button
                              type="button"
                              className="primary-button"
                              disabled={busyAction === `application-${applicationType}-${selectedApplication.id}-approved`}
                              onClick={() => handleApplicationDecision(applicationType, selectedApplication.id, "approved")}
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={busyAction === `application-${applicationType}-${selectedApplication.id}-pending`}
                              onClick={() => handleApplicationDecision(applicationType, selectedApplication.id, "pending")}
                            >
                              Mettre en attente
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={busyAction === `application-${applicationType}-${selectedApplication.id}-rejected`}
                              onClick={() => handleApplicationDecision(applicationType, selectedApplication.id, "rejected")}
                            >
                              Refuser
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="mini-card">
                          <strong>Aucune fiche selectionnee</strong>
                          <span>Choisissez une candidature pour voir le formulaire saisi.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel glass-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Analytics</p>
                  <h2>Lecture business</h2>
                </div>
              </div>
              <div className="analytics-grid">
                <article className="mini-card">
                  <strong>{money(data.stats.totalRevenue)} DT</strong>
                  <span>Revenus logistiques estimes</span>
                </article>
                <article className="mini-card">
                  <strong>{data.shipments.filter((shipment) => shipment.status === "pending").length}</strong>
                  <span>Colis a lancer</span>
                </article>
                <article className="mini-card">
                  <strong>{data.shipments.filter((shipment) => shipment.driver_id).length}</strong>
                  <span>Colis assignes</span>
                </article>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </main>
  )
}
