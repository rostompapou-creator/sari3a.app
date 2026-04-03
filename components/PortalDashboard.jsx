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

function formatDateTime(value) {
  if (!value) return "-"
  return new Date(value).toLocaleString("fr-FR")
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function shipmentScanUrl(shipment) {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/delivery/scan?tracking=${encodeURIComponent(shipment.tracking_number)}`
}

function shipmentQrImageUrl(shipment) {
  return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(shipmentScanUrl(shipment))}`
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

function ActionIcon({ name }) {
  const icons = {
    add: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    print: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 9V4h10v5M7 17H5V9h14v8h-2M8 14h8v6H8z" />
      </svg>
    ),
    view: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    edit: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20zM13.5 6.5l3.5 3.5" />
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    ),
    delete: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13M10 10v7M14 10v7" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.3 2.6 2.9.4-2.1 2.1.5 2.9L12 9.8 9.4 11l.5-2.9-2.1-2.1 2.9-.4L12 3zM12 14a2 2 0 110 4 2 2 0 010-4z" />
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
      </svg>
    )
  }

  return icons[name] ?? null
}

function IconButton({ icon, label, className = "secondary-button", ...props }) {
  return (
    <button type="button" className={`${className} icon-button`} aria-label={label} title={label} {...props}>
      <ActionIcon name={icon} />
    </button>
  )
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
  const [adminSection, setAdminSection] = useState("clients")
  const [adminSearch, setAdminSearch] = useState("")
  const [adminDialog, setAdminDialog] = useState(null)
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
  const managedUsers = [...data.clients, ...data.drivers, ...data.partners, ...data.admins]
  const dashboardShipments = filteredShipments.length ? filteredShipments : data.shipments
  const adminSections = [
    { key: "shipments", label: "Colis" },
    { key: "clients", label: "Clients" },
    { key: "partners", label: "Partenaires" },
    { key: "drivers", label: "Livreurs" },
    { key: "settings", label: "Parametres societe" },
    { key: "analytics", label: "Lecture business" },
    { key: "applications", label: "Candidatures en instance" },
    { key: "users", label: "Utilisateurs" }
  ]
  const pendingApplications = useMemo(
    () => [
      ...pendingDriverApplications.map((application) => ({
        ...application,
        applicationType: "driver",
        title: application.full_name,
        subtitle: application.vehicle || application.email
      })),
      ...pendingPartnerApplications.map((application) => ({
        ...application,
        applicationType: "partner",
        title: application.business_name,
        subtitle: application.contact_name || application.email
      }))
    ],
    [pendingDriverApplications, pendingPartnerApplications]
  )
  const companySettingsRecords = useMemo(
    () => [
      {
        id: "branding",
        title: "Identite & accueil",
        subtitle: `${settingsForm.brand_name} · ${settingsForm.tagline}`,
        note: `${settingsForm.support_phone || "Sans telephone"} · ${settingsForm.support_email || "Sans email"}`
      },
      {
        id: "statuses",
        title: "Statuts colis",
        subtitle: `${progressStatuses.length} standards + ${shipmentStatusesForm.length} additionnels`,
        note: shipmentStatusesForm.length ? shipmentStatusesForm.map((status) => status.label).join(", ") : "Aucun statut additionnel"
      }
    ],
    [settingsForm, progressStatuses.length, shipmentStatusesForm]
  )
  const adminUserCollections = {
    clients: data.clients,
    partners: data.partners,
    drivers: data.drivers,
    users: managedUsers
  }
  const adminUsers = useMemo(() => {
    const source = adminUserCollections[adminSection] ?? []
    const query = adminSearch.trim().toLowerCase()
    if (!query) return source
    return source.filter((user) =>
      [user.full_name, user.email, user.phone, user.governorate, user.address, user.vehicle, user.status, roleLabel(user.role)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [adminSearch, adminSection, data.clients, data.drivers, data.partners, managedUsers])
  const adminApplications = useMemo(() => {
    const query = adminSearch.trim().toLowerCase()
    if (!query) return pendingApplications
    return pendingApplications.filter((application) =>
      [application.title, application.subtitle, application.email, application.phone, application.governorate, application.address, application.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [adminSearch, pendingApplications])
  const adminShipments = useMemo(() => {
    const query = adminSearch.trim().toLowerCase()
    if (!query) return data.shipments
    return data.shipments.filter((shipment) =>
      [
        shipment.tracking_number,
        shipment.title,
        shipment.recipient_name,
        shipment.recipient_phone,
        shipment.recipient_address,
        shipment.governorate,
        shipment.city,
        shipment.partner_name,
        shipment.driver_name,
        statusLabels[shipment.status] ?? shipment.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [adminSearch, data.shipments, statusLabels])
  const adminSettingsItems = useMemo(() => {
    const query = adminSearch.trim().toLowerCase()
    if (!query) return companySettingsRecords
    return companySettingsRecords.filter((item) =>
      [item.title, item.subtitle, item.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [adminSearch, companySettingsRecords])
  const viewedUser =
    adminDialog?.type === "user-view"
      ? managedUsers.find((user) => user.id === adminDialog.userId) ?? null
      : null
  const viewedShipment =
    adminDialog?.type === "shipment-view"
      ? data.shipments.find((shipment) => shipment.id === adminDialog.shipmentId) ?? null
      : null
  const viewedApplication =
    adminDialog?.type === "application-view"
      ? (() => {
          const source = adminDialog.applicationType === "driver" ? data.driverApplications : data.partnerApplications
          const found = source.find((application) => application.id === adminDialog.applicationId)
          return found ? { ...found, applicationType: adminDialog.applicationType } : null
        })()
      : null

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
      if (adminDialog?.type === "shipment-form") closeAdminDialog()
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
      closeAdminDialog()
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
      if (adminDialog?.type === "settings" && adminDialog.mode === "edit") closeAdminDialog()
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
        if (adminDialog?.type === "application-view") closeAdminDialog()
        return
      }

      setMessage(`Candidature ${type === "driver" ? "livreur" : "partenaire"} mise a jour.`)
      if (adminDialog?.type === "application-view") closeAdminDialog()
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

  function openUserForm(roleValue = "client") {
    resetUserForm()
    setUserForm((current) => ({
      ...current,
      role: roleValue
    }))
    setAdminDialog({ type: "user-form" })
  }

  function openEditUser(user) {
    loadUserForEdit(user)
    setAdminDialog({ type: "user-form" })
  }

  function openUserView(user) {
    setAdminDialog({ type: "user-view", userId: user.id })
  }

  function openApplicationView(application) {
    if (application.applicationType === "driver") setSelectedDriverApplicationId(application.id)
    if (application.applicationType === "partner") setSelectedPartnerApplicationId(application.id)
    setAdminDialog({ type: "application-view", applicationType: application.applicationType, applicationId: application.id })
  }

  function openSettingsDialog(mode = "view") {
    setAdminDialog({ type: "settings", mode })
  }

  function openShipmentEditor(shipment = null) {
    if (shipment) {
      loadShipmentForEdit(shipment)
      setSelectedShipmentId(shipment.id)
    } else {
      resetShipmentForm()
    }

    if (role === "admin") {
      setAdminDialog({ type: "shipment-form" })
      return
    }

    setSelectedShipmentId(shipment?.id ?? selectedShipmentId)
    const section = document.getElementById("shipment-workspace")
    section?.scrollIntoView({ behavior: "smooth", block: "start" })
    setMessage(shipment ? "Le formulaire colis est charge pour modification." : "Le formulaire colis est pret pour un nouvel ajout.")
  }

  function openShipmentView(shipment) {
    setSelectedShipmentId(shipment.id)
    setAdminDialog({ type: "shipment-view", shipmentId: shipment.id })
  }

  function closeAdminDialog() {
    setAdminDialog(null)
  }

  function printDocument(title, html) {
    const printWindow = window.open("", "_blank", "width=960,height=720")
    if (!printWindow) {
      setError("Autorisez les popups pour imprimer depuis l'admin.")
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Georgia, serif; padding: 24px; color: #081a44; }
            h1, h2 { margin: 0 0 16px; }
            .meta { margin-bottom: 20px; color: #43506d; }
            .card { border: 1px solid #d6a328; border-radius: 14px; padding: 16px; margin-bottom: 14px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .print-layout { display: grid; grid-template-columns: minmax(0, 1.3fr) 240px; gap: 16px; align-items: start; }
            .qr-card { text-align: center; }
            .qr-card img { width: 100%; max-width: 220px; height: auto; display: block; margin: 0 auto 10px; }
            .qr-note { font-size: 12px; line-height: 1.5; color: #43506d; }
            .qr-token { font-size: 11px; word-break: break-word; color: #6b7280; }
            .label { font-size: 12px; text-transform: uppercase; color: #6b7280; }
            .value { font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d7dbe6; padding: 10px; text-align: left; }
            th { background: #f7f9fc; }
            @media print {
              .print-layout { grid-template-columns: minmax(0, 1fr) 220px; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">Sari3a Delivery · ${escapeHtml(new Date().toLocaleString("fr-FR"))}</div>
          ${html}
        </body>
      </html>`)
    printWindow.document.close()

    const runPrint = () => {
      printWindow.focus()
      printWindow.print()
    }

    const images = Array.from(printWindow.document.images)
    if (!images.length) {
      window.setTimeout(runPrint, 150)
      return
    }

    let pending = images.filter((image) => !image.complete).length
    if (pending === 0) {
      window.setTimeout(runPrint, 150)
      return
    }

    const markReady = () => {
      pending -= 1
      if (pending <= 0) window.setTimeout(runPrint, 150)
    }

    images.forEach((image) => {
      if (image.complete) return
      image.addEventListener("load", markReady, { once: true })
      image.addEventListener("error", markReady, { once: true })
    })

    window.setTimeout(runPrint, 2500)
  }

  function printUser(user) {
    printDocument(
      `Fiche ${roleLabel(user.role)} - ${user.full_name}`,
      `
        <div class="card">
          <div class="grid">
            <div><div class="label">Nom</div><div class="value">${escapeHtml(user.full_name)}</div></div>
            <div><div class="label">Role</div><div class="value">${escapeHtml(roleLabel(user.role))}</div></div>
            <div><div class="label">Email</div><div class="value">${escapeHtml(user.email)}</div></div>
            <div><div class="label">Telephone</div><div class="value">${escapeHtml(user.phone || "-")}</div></div>
            <div><div class="label">Gouvernorat</div><div class="value">${escapeHtml(user.governorate || "-")}</div></div>
            <div><div class="label">Statut</div><div class="value">${escapeHtml(user.status || "-")}</div></div>
            <div><div class="label">Adresse</div><div class="value">${escapeHtml(user.address || "-")}</div></div>
            <div><div class="label">Vehicule</div><div class="value">${escapeHtml(user.vehicle || "-")}</div></div>
          </div>
        </div>
      `
    )
  }

  function printApplication(application) {
    printDocument(
      `Candidature ${application.applicationType === "driver" ? "Livreur" : "Partenaire"} - ${application.title}`,
      `
        <div class="card">
          <div class="grid">
            <div><div class="label">Nom</div><div class="value">${escapeHtml(application.title)}</div></div>
            <div><div class="label">Type</div><div class="value">${escapeHtml(application.applicationType === "driver" ? "Livreur" : "Partenaire")}</div></div>
            <div><div class="label">Email</div><div class="value">${escapeHtml(application.email)}</div></div>
            <div><div class="label">Telephone</div><div class="value">${escapeHtml(application.phone || "-")}</div></div>
            <div><div class="label">Gouvernorat</div><div class="value">${escapeHtml(application.governorate || "-")}</div></div>
            <div><div class="label">Statut</div><div class="value">${escapeHtml(applicationStatusLabel(application.status))}</div></div>
            <div><div class="label">Adresse</div><div class="value">${escapeHtml(application.address || "-")}</div></div>
            <div><div class="label">Details</div><div class="value">${escapeHtml(application.subtitle || "-")}</div></div>
          </div>
        </div>
      `
    )
  }

  function printShipment(shipment) {
    const scanUrl = shipmentScanUrl(shipment)
    const qrImageUrl = shipmentQrImageUrl(shipment)

    printDocument(
      `Colis ${shipment.tracking_number}`,
      `
        <div class="print-layout">
          <div class="card">
            <div class="grid">
              <div><div class="label">Tracking</div><div class="value">${escapeHtml(shipment.tracking_number)}</div></div>
              <div><div class="label">Statut</div><div class="value">${escapeHtml(statusLabels[shipment.status] ?? shipment.status)}</div></div>
              <div><div class="label">Date creation</div><div class="value">${escapeHtml(formatDateTime(shipment.created_at))}</div></div>
              <div><div class="label">Titre</div><div class="value">${escapeHtml(shipment.title)}</div></div>
              <div><div class="label">Destinataire</div><div class="value">${escapeHtml(shipment.recipient_name)}</div></div>
              <div><div class="label">Telephone</div><div class="value">${escapeHtml(shipment.recipient_phone || "-")}</div></div>
              <div><div class="label">Adresse</div><div class="value">${escapeHtml(shipment.recipient_address || "-")}</div></div>
              <div><div class="label">Partenaire</div><div class="value">${escapeHtml(shipment.partner_name || "-")}</div></div>
              <div><div class="label">Livreur</div><div class="value">${escapeHtml(shipment.driver_name || "-")}</div></div>
              <div><div class="label">Gouvernorat</div><div class="value">${escapeHtml(shipment.governorate || "-")}</div></div>
              <div><div class="label">Ville</div><div class="value">${escapeHtml(shipment.city || "-")}</div></div>
              <div><div class="label">Frais livraison</div><div class="value">${escapeHtml(`${money(shipment.delivery_fee)} DT`)}</div></div>
              <div><div class="label">COD</div><div class="value">${escapeHtml(`${money(shipment.cod_amount)} DT`)}</div></div>
            </div>
          </div>
          <div class="card qr-card">
            <img src="${escapeHtml(qrImageUrl)}" alt="QR code colis ${escapeHtml(shipment.tracking_number)}" />
            <div class="value">${escapeHtml(shipment.tracking_number)}</div>
            <div class="qr-note">Scanner a la livraison pour ouvrir la page Sari3a de confirmation.</div>
            <div class="qr-token">${escapeHtml(scanUrl)}</div>
          </div>
        </div>
      `
    )
  }

  function printSettingsOverview() {
    printDocument(
      "Parametres de la societe",
      `
        <div class="card">
          <div class="grid">
            <div><div class="label">Marque</div><div class="value">${escapeHtml(settingsForm.brand_name)}</div></div>
            <div><div class="label">Tagline</div><div class="value">${escapeHtml(settingsForm.tagline)}</div></div>
            <div><div class="label">Telephone</div><div class="value">${escapeHtml(settingsForm.support_phone || "-")}</div></div>
            <div><div class="label">Email</div><div class="value">${escapeHtml(settingsForm.support_email || "-")}</div></div>
            <div><div class="label">Hero</div><div class="value">${escapeHtml(settingsForm.hero_title || "-")}</div></div>
            <div><div class="label">Statuts colis</div><div class="value">${escapeHtml(shipmentStatusesForm.map((status) => status.label).join(", ") || "Aucun statut additionnel")}</div></div>
            <div><div class="label">Candidatures en attente</div><div class="value">${escapeHtml(`${pendingApplications.length}`)}</div></div>
          </div>
        </div>
      `
    )
  }

  function printAnalyticsOverview() {
    printDocument(
      "Analytics livraisons",
      `
        <div class="card">
          <div class="grid">
            <div><div class="label">Total livraisons</div><div class="value">${escapeHtml(`${money(data.financials?.totalAmount)} DT`)}</div></div>
            <div><div class="label">Partenaires</div><div class="value">${escapeHtml(`${partnerFinancialRows.length}`)}</div></div>
            <div><div class="label">Livreurs</div><div class="value">${escapeHtml(`${driverFinancialRows.length}`)}</div></div>
            <div><div class="label">Colis en attente</div><div class="value">${escapeHtml(`${data.shipments.filter((shipment) => shipment.status === "pending").length}`)}</div></div>
          </div>
        </div>
      `
    )
  }

  function printUserList(title, users) {
    printDocument(
      title,
      `
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Role</th>
              <th>Email</th>
              <th>Telephone</th>
              <th>Gouvernorat</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (user) => `
                  <tr>
                    <td>${escapeHtml(user.full_name)}</td>
                    <td>${escapeHtml(roleLabel(user.role))}</td>
                    <td>${escapeHtml(user.email)}</td>
                    <td>${escapeHtml(user.phone || "-")}</td>
                    <td>${escapeHtml(user.governorate || "-")}</td>
                    <td>${escapeHtml(user.status || "-")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
    )
  }

  function printApplicationList(title, applications) {
    printDocument(
      title,
      `
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Telephone</th>
              <th>Gouvernorat</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${applications
              .map(
                (application) => `
                  <tr>
                    <td>${escapeHtml(application.title)}</td>
                    <td>${escapeHtml(application.applicationType === "driver" ? "Livreur" : "Partenaire")}</td>
                    <td>${escapeHtml(application.email)}</td>
                    <td>${escapeHtml(application.phone || "-")}</td>
                    <td>${escapeHtml(application.governorate || "-")}</td>
                    <td>${escapeHtml(applicationStatusLabel(application.status))}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
    )
  }

  function printShipmentList(title, shipments) {
    printDocument(
      title,
      `
        <table>
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Titre</th>
              <th>Cree le</th>
              <th>Statut</th>
              <th>Destinataire</th>
              <th>Partenaire</th>
              <th>Livreur</th>
            </tr>
          </thead>
          <tbody>
            ${shipments
              .map(
                (shipment) => `
                  <tr>
                    <td>${escapeHtml(shipment.tracking_number)}</td>
                    <td>${escapeHtml(shipment.title)}</td>
                    <td>${escapeHtml(formatDateTime(shipment.created_at))}</td>
                    <td>${escapeHtml(statusLabels[shipment.status] ?? shipment.status)}</td>
                    <td>${escapeHtml(shipment.recipient_name)}</td>
                    <td>${escapeHtml(shipment.partner_name || "-")}</td>
                    <td>${escapeHtml(shipment.driver_name || "-")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
    )
  }

  function renderAdminConsole() {
    return (
      <section className="admin-console-section">
        <div className="panel glass-card admin-console-panel">
          <div className="admin-console">
            <div className="admin-content">
              <div className="admin-toolbar">
                <input
                  className="admin-search-input"
                  value={adminSearch}
                  placeholder="Recherche multi-critere : nom, email, telephone, gouvernorat, statut..."
                  onChange={(event) => setAdminSearch(event.target.value)}
                />
                <div className="admin-toolbar-actions">
                  {adminSection === "shipments" ? (
                    <>
                      <IconButton icon="add" label="Ajouter un colis" className="primary-button" onClick={() => openShipmentEditor()} />
                      <IconButton
                        icon="print"
                        label="Imprimer la liste des colis"
                        onClick={() => printShipmentList("Liste des colis", adminShipments)}
                      />
                    </>
                  ) : null}
                  {["clients", "partners", "drivers", "users"].includes(adminSection) ? (
                    <>
                      <IconButton
                        icon="add"
                        label={`Ajouter ${adminSections.find((section) => section.key === adminSection)?.label ?? "un enregistrement"}`}
                        className="primary-button"
                        onClick={() =>
                          openUserForm(
                            adminSection === "clients"
                              ? "client"
                              : adminSection === "partners"
                                ? "partner"
                                : adminSection === "drivers"
                                ? "driver"
                                  : "admin"
                          )
                        }
                      />
                      <IconButton
                        icon="print"
                        label={`Imprimer ${adminSections.find((section) => section.key === adminSection)?.label ?? "la liste"}`}
                        onClick={() =>
                          printUserList(
                            `Liste ${adminSections.find((section) => section.key === adminSection)?.label}`,
                            adminUsers
                          )
                        }
                      />
                    </>
                  ) : null}
                  {adminSection === "settings" ? (
                    <>
                      <IconButton icon="settings" label="Modifier les parametres" className="primary-button" onClick={() => openSettingsDialog("edit")} />
                      <IconButton icon="print" label="Imprimer les parametres" onClick={printSettingsOverview} />
                    </>
                  ) : null}
                  {adminSection === "analytics" ? (
                    <IconButton icon="print" label="Imprimer la lecture business" onClick={printAnalyticsOverview} />
                  ) : null}
                  {adminSection === "applications" ? (
                    <IconButton
                      icon="print"
                      label="Imprimer les candidatures"
                      onClick={() => printApplicationList("Candidatures en instance", adminApplications)}
                    />
                  ) : null}
                </div>
              </div>

              {adminSection === "shipments" ? (
                <div className="admin-table-shell">
                  {adminShipments.length ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tracking</th>
                          <th>Titre</th>
                          <th>Cree le</th>
                          <th>Statut</th>
                          <th>Partenaire</th>
                          <th>Livreur</th>
                          <th>Destinataire</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminShipments.map((shipment) => (
                          <tr key={shipment.id}>
                            <td>{shipment.tracking_number}</td>
                            <td>{shipment.title}</td>
                            <td>{formatDateTime(shipment.created_at)}</td>
                            <td>{statusLabels[shipment.status] ?? shipment.status}</td>
                            <td>{shipment.partner_name || "-"}</td>
                            <td>{shipment.driver_name || "-"}</td>
                            <td>{shipment.recipient_name}</td>
                            <td>
                              <div className="admin-table-actions">
                                <IconButton icon="view" label={`Voir le colis ${shipment.tracking_number}`} onClick={() => openShipmentView(shipment)} />
                                <IconButton icon="edit" label={`Modifier le colis ${shipment.tracking_number}`} onClick={() => openShipmentEditor(shipment)} />
                                <IconButton icon="print" label={`Imprimer le colis ${shipment.tracking_number}`} onClick={() => printShipment(shipment)} />
                                <IconButton
                                  icon="delete"
                                  label={`Supprimer le colis ${shipment.tracking_number}`}
                                  className="ghost-button"
                                  disabled={busyAction === `delete-${shipment.id}`}
                                  onClick={() => handleDeleteShipment(shipment.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="mini-card">
                      <strong>Aucun colis trouve</strong>
                      <span>Essayez un autre filtre ou ajoutez un nouveau colis.</span>
                    </div>
                  )}
                </div>
              ) : null}

              {["clients", "partners", "drivers", "users"].includes(adminSection) ? (
                <div className="admin-table-shell">
                  {adminUsers.length ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Role</th>
                          <th>Email</th>
                          <th>Telephone</th>
                          <th>Gouvernorat</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.full_name}</td>
                            <td>{roleLabel(user.role)}</td>
                            <td>{user.email}</td>
                            <td>{user.phone || "-"}</td>
                            <td>{user.governorate || "-"}</td>
                            <td>{user.status || "-"}</td>
                            <td>
                              <div className="admin-table-actions">
                                <IconButton icon="view" label={`Voir ${user.full_name}`} onClick={() => openUserView(user)} />
                                <IconButton icon="edit" label={`Modifier ${user.full_name}`} onClick={() => openEditUser(user)} />
                                <IconButton icon="print" label={`Imprimer ${user.full_name}`} onClick={() => printUser(user)} />
                                <IconButton
                                  icon="delete"
                                  label={`Supprimer ${user.full_name}`}
                                  className="ghost-button"
                                  disabled={busyAction === `user-delete-${user.id}`}
                                  onClick={() => handleDeleteUser(user.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="mini-card">
                      <strong>Aucun resultat</strong>
                      <span>Essayez un autre mot-cle ou ajoutez un nouvel enregistrement.</span>
                    </div>
                  )}
                </div>
              ) : null}

              {adminSection === "settings" ? (
                <div className="admin-table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rubrique</th>
                        <th>Resume</th>
                        <th>Details</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminSettingsItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{item.subtitle}</td>
                          <td>{item.note}</td>
                          <td>
                            <div className="admin-table-actions">
                              <IconButton icon="view" label={`Voir ${item.title}`} onClick={() => openSettingsDialog("view")} />
                              <IconButton icon="settings" label={`Modifier ${item.title}`} onClick={() => openSettingsDialog("edit")} />
                              <IconButton icon="print" label={`Imprimer ${item.title}`} onClick={printSettingsOverview} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {adminSection === "analytics" ? (
                <div className="admin-content">
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
                    <article className="mini-card">
                      <strong>{data.stats.total}</strong>
                      <span>Total colis</span>
                    </article>
                    <article className="mini-card">
                      <strong>{data.stats.inMotion}</strong>
                      <span>En mouvement</span>
                    </article>
                    <article className="mini-card">
                      <strong>{money(data.stats.codPending)} DT</strong>
                      <span>COD en attente</span>
                    </article>
                  </div>

                  <div className="admin-table-shell">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Partenaire</th>
                          <th>Colis</th>
                          <th>Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerFinancialRows.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.shipments}</td>
                            <td>{money(item.amount)} DT</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-table-shell">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Livreur</th>
                          <th>Colis</th>
                          <th>Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverFinancialRows.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.shipments}</td>
                            <td>{money(item.amount)} DT</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {adminSection === "applications" ? (
                <div className="admin-table-shell">
                  {adminApplications.length ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Type</th>
                          <th>Email</th>
                          <th>Telephone</th>
                          <th>Gouvernorat</th>
                          <th>Detail</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminApplications.map((application) => (
                          <tr key={`${application.applicationType}-${application.id}`}>
                            <td>{application.title}</td>
                            <td>{application.applicationType === "driver" ? "Livreur" : "Partenaire"}</td>
                            <td>{application.email}</td>
                            <td>{application.phone || "-"}</td>
                            <td>{application.governorate}</td>
                            <td>{application.subtitle || "-"}</td>
                            <td>
                              <div className="admin-table-actions">
                                <IconButton icon="view" label={`Voir ${application.title}`} onClick={() => openApplicationView(application)} />
                                <IconButton icon="print" label={`Imprimer ${application.title}`} onClick={() => printApplication(application)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="mini-card">
                      <strong>Aucune candidature en instance</strong>
                      <span>Les candidatures en attente apparaitront ici.</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div className="dashboard-hero-top">
          <Sari3aLogo compact />
          {role === "admin" ? (
            <>
              <div className="admin-hero-center">
                <p className="eyebrow">Centre de commandement Sari3a</p>
                <h1 className="dashboard-hero-title dashboard-hero-title-unified">{dashboardHeroTitle(role)}</h1>
              </div>
              <div className="admin-hero-side">
                <div className="hero-user-meta">
                  <span className="role-badge">{roleLabel(role)}</span>
                  <strong>{data.user.full_name}</strong>
                  <span>{data.user.governorate}</span>
                </div>
                <button type="button" className="secondary-button" onClick={handleLogout}>
                  Deconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="hero-user-meta">
                <span className="role-badge">{roleLabel(role)}</span>
                <strong>{data.user.full_name}</strong>
                <span>{data.user.governorate}</span>
              </div>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Deconnexion
              </button>
            </>
          )}
        </div>

        {role !== "admin" ? (
          <div className="hero-copy">
            <div>
              <p className="eyebrow">Centre de commandement Sari3a</p>
              <h1 className={role === "client" || role === "driver" || role === "admin" ? "dashboard-hero-title dashboard-hero-title-unified" : "dashboard-hero-title"}>
                {dashboardHeroTitle(role)}
              </h1>
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
        ) : null}
      </section>

      {role === "admin" ? (
        <section className="admin-top-menu glass-card">
          <div className="admin-top-menu-header">
            <span className="role-badge">Recherche multi-critere + impression</span>
          </div>
          <div className="admin-sidebar">
            {adminSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`admin-nav-button ${adminSection === section.key ? "is-active" : ""}`}
                onClick={() => {
                  setAdminSection(section.key)
                  setAdminSearch("")
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="flash-message success">{message}</p> : null}
      {error ? <p className="flash-message error">{error}</p> : null}

      {role === "admin" ? renderAdminConsole() : null}

      <section className="dashboard-main-grid">
        <div className="panel glass-card" id="shipment-workspace">
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
                <p className="shipment-created-at">Cree le {formatDateTime(shipment.created_at)}</p>
                <p>{shipment.recipient_name} · {shipment.governorate}</p>
                <p>{shipment.partner_name ?? "Partenaire non affecte"} · {shipment.driver_name ?? "Livreur a assigner"}</p>
                <div className="shipment-actions">
                  {(role === "partner" || role === "admin" || (role === "client" && ["pending", "picked_up"].includes(shipment.status))) ? (
                    <button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); role === "admin" ? openShipmentEditor(shipment) : loadShipmentForEdit(shipment) }}>
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

        {(role === "client" || role === "partner") ? (
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

          {role === "admin" && false ? (
            <div className="panel glass-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Admin</p>
                  <h2>Back-office societe</h2>
                </div>
                <span className="role-badge">Recherche multi-critere + impression</span>
              </div>

              <div className="admin-console">
                <div className="admin-content">
                  <div className="admin-toolbar">
                    <div>
                      <p className="eyebrow">Liste active</p>
                      <h3>{adminSections.find((section) => section.key === adminSection)?.label}</h3>
                      <span>Les donnees sont affichees en table avec actions directes et recherche multi-critere.</span>
                    </div>
                    <div className="admin-toolbar-actions">
                      <input
                        className="admin-search-input"
                        value={adminSearch}
                        placeholder="Recherche multi-critere : nom, email, telephone, gouvernorat, statut..."
                        onChange={(event) => setAdminSearch(event.target.value)}
                      />
                      {adminSection === "shipments" ? (
                        <>
                          <button type="button" className="primary-button" onClick={() => openShipmentEditor()}>
                            Ajouter
                          </button>
                          <button type="button" className="secondary-button" onClick={() => printShipmentList("Liste des colis", adminShipments)}>
                            Imprimer
                          </button>
                        </>
                      ) : null}
                      {["clients", "partners", "drivers", "users"].includes(adminSection) ? (
                        <>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                              openUserForm(
                                adminSection === "clients"
                                  ? "client"
                                  : adminSection === "partners"
                                    ? "partner"
                                    : adminSection === "drivers"
                                      ? "driver"
                                      : "admin"
                              )
                            }
                          >
                            Ajouter
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              printUserList(
                                `Liste ${adminSections.find((section) => section.key === adminSection)?.label}`,
                                adminUsers
                              )
                            }
                          >
                            Imprimer
                          </button>
                        </>
                      ) : null}
                      {adminSection === "settings" ? (
                        <>
                          <button type="button" className="primary-button" onClick={() => openSettingsDialog("edit")}>
                            Modifier
                          </button>
                          <button type="button" className="secondary-button" onClick={printSettingsOverview}>
                            Imprimer
                          </button>
                        </>
                      ) : null}
                      {adminSection === "analytics" ? (
                        <button type="button" className="secondary-button" onClick={printAnalyticsOverview}>
                          Imprimer
                        </button>
                      ) : null}
                      {adminSection === "applications" ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => printApplicationList("Candidatures en instance", adminApplications)}
                        >
                          Imprimer
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {adminSection === "shipments" ? (
                    <div className="admin-table-shell">
                      {adminShipments.length ? (
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Tracking</th>
                              <th>Titre</th>
                              <th>Statut</th>
                              <th>Partenaire</th>
                              <th>Livreur</th>
                              <th>Destinataire</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminShipments.map((shipment) => (
                              <tr key={shipment.id}>
                                <td>{shipment.tracking_number}</td>
                                <td>{shipment.title}</td>
                                <td>{statusLabels[shipment.status] ?? shipment.status}</td>
                                <td>{shipment.partner_name || "-"}</td>
                                <td>{shipment.driver_name || "-"}</td>
                                <td>{shipment.recipient_name}</td>
                                <td>
                                  <div className="admin-table-actions">
                                    <button type="button" className="secondary-button" onClick={() => openShipmentView(shipment)}>Voir</button>
                                    <button type="button" className="secondary-button" onClick={() => openShipmentEditor(shipment)}>Modifier</button>
                                    <button type="button" className="secondary-button" onClick={() => printShipment(shipment)}>Imprimer</button>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      disabled={busyAction === `delete-${shipment.id}`}
                                      onClick={() => handleDeleteShipment(shipment.id)}
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="mini-card">
                          <strong>Aucun colis trouve</strong>
                          <span>Essayez un autre filtre ou ajoutez un nouveau colis.</span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {["clients", "partners", "drivers", "users"].includes(adminSection) ? (
                    <div className="admin-table-shell">
                      {adminUsers.length ? (
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Role</th>
                              <th>Email</th>
                              <th>Telephone</th>
                              <th>Gouvernorat</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUsers.map((user) => (
                              <tr key={user.id}>
                                <td>{user.full_name}</td>
                                <td>{roleLabel(user.role)}</td>
                                <td>{user.email}</td>
                                <td>{user.phone || "-"}</td>
                                <td>{user.governorate || "-"}</td>
                                <td>{user.status || "-"}</td>
                                <td>
                                  <div className="admin-table-actions">
                                    <button type="button" className="secondary-button" onClick={() => openUserView(user)}>Voir</button>
                                    <button type="button" className="secondary-button" onClick={() => openEditUser(user)}>Modifier</button>
                                    <button type="button" className="secondary-button" onClick={() => printUser(user)}>Imprimer</button>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      disabled={busyAction === `user-delete-${user.id}`}
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="mini-card">
                          <strong>Aucun resultat</strong>
                          <span>Essayez un autre mot-cle ou ajoutez un nouvel enregistrement.</span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {adminSection === "settings" ? (
                    <div className="admin-table-shell">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Rubrique</th>
                            <th>Resume</th>
                            <th>Details</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminSettingsItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.title}</td>
                              <td>{item.subtitle}</td>
                              <td>{item.note}</td>
                              <td>
                                <div className="admin-table-actions">
                                  <button type="button" className="secondary-button" onClick={() => openSettingsDialog("view")}>Voir</button>
                                  <button type="button" className="secondary-button" onClick={() => openSettingsDialog("edit")}>Modifier</button>
                                  <button type="button" className="secondary-button" onClick={printSettingsOverview}>Imprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {adminSection === "analytics" ? (
                    <div className="admin-content">
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

                      <div className="admin-table-shell">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Partenaire</th>
                              <th>Colis</th>
                              <th>Montant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {partnerFinancialRows.map((item) => (
                              <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.shipments}</td>
                                <td>{money(item.amount)} DT</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="admin-table-shell">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Livreur</th>
                              <th>Colis</th>
                              <th>Montant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driverFinancialRows.map((item) => (
                              <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.shipments}</td>
                                <td>{money(item.amount)} DT</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {adminSection === "applications" ? (
                    <div className="admin-table-shell">
                      {adminApplications.length ? (
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Type</th>
                              <th>Email</th>
                              <th>Telephone</th>
                              <th>Gouvernorat</th>
                              <th>Detail</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminApplications.map((application) => (
                              <tr key={`${application.applicationType}-${application.id}`}>
                                <td>{application.title}</td>
                                <td>{application.applicationType === "driver" ? "Livreur" : "Partenaire"}</td>
                                <td>{application.email}</td>
                                <td>{application.phone || "-"}</td>
                                <td>{application.governorate}</td>
                                <td>{application.subtitle || "-"}</td>
                                <td>
                                  <div className="admin-table-actions">
                                    <button type="button" className="secondary-button" onClick={() => openApplicationView(application)}>Voir</button>
                                    <button type="button" className="secondary-button" onClick={() => printApplication(application)}>Imprimer</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="mini-card">
                          <strong>Aucune candidature en instance</strong>
                          <span>Les candidatures en attente apparaitront ici.</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {role === "admin" && false ? (
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

      {adminDialog?.type === "shipment-form" ? (
        <div className="modal-backdrop" onClick={closeAdminDialog}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">{editingShipmentId ? "Edition" : "Creation"}</p>
                <h2>CRUD colis</h2>
              </div>
              <button type="button" className="secondary-button" onClick={() => { resetShipmentForm(); closeAdminDialog() }}>
                Fermer
              </button>
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
                <label>
                  Partenaire
                  <select value={shipmentForm.partner_id} onChange={(event) => setShipmentForm((current) => ({ ...current, partner_id: event.target.value }))} required>
                    <option value="">Choisir</option>
                    {data.partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.full_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Client
                  <select value={shipmentForm.client_id} onChange={(event) => setShipmentForm((current) => ({ ...current, client_id: event.target.value }))} required>
                    <option value="">Choisir</option>
                    {data.clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.full_name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid-two">
                <label>
                  Livreur
                  <select value={shipmentForm.driver_id} onChange={(event) => setShipmentForm((current) => ({ ...current, driver_id: event.target.value }))}>
                    <option value="">Aucun</option>
                    {data.drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Statut
                  <select value={shipmentForm.status} onChange={(event) => setShipmentForm((current) => ({ ...current, status: event.target.value }))}>
                    {shipmentStatuses.map((status) => (
                      <option key={status.key} value={status.key}>{status.label}</option>
                    ))}
                  </select>
                </label>
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
              <div className="shipment-actions">
                <button type="submit" className="primary-button" disabled={busyAction === "shipment"}>
                  {busyAction === "shipment" ? "Enregistrement..." : editingShipmentId ? "Mettre a jour le colis" : "Creer le colis"}
                </button>
                <button type="button" className="secondary-button" onClick={() => { resetShipmentForm(); closeAdminDialog() }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {adminDialog?.type === "shipment-view" && viewedShipment ? (
        <div className="modal-backdrop" onClick={closeAdminDialog}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Consultation colis</p>
                <h2>{viewedShipment.tracking_number}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={closeAdminDialog}>
                Fermer
              </button>
            </div>
            <div className="application-detail-grid">
              <article><span>Titre</span><strong>{viewedShipment.title}</strong></article>
              <article><span>Statut</span><strong>{statusLabels[viewedShipment.status] ?? viewedShipment.status}</strong></article>
              <article><span>Date de creation</span><strong>{formatDateTime(viewedShipment.created_at)}</strong></article>
              <article><span>Destinataire</span><strong>{viewedShipment.recipient_name}</strong></article>
              <article><span>Telephone</span><strong>{viewedShipment.recipient_phone || "-"}</strong></article>
              <article><span>Adresse</span><strong>{viewedShipment.recipient_address || "-"}</strong></article>
              <article><span>Gouvernorat</span><strong>{viewedShipment.governorate || "-"}</strong></article>
              <article><span>Ville</span><strong>{viewedShipment.city || "-"}</strong></article>
              <article><span>Partenaire</span><strong>{viewedShipment.partner_name || "-"}</strong></article>
              <article><span>Livreur</span><strong>{viewedShipment.driver_name || "-"}</strong></article>
              <article><span>Frais livraison</span><strong>{money(viewedShipment.delivery_fee)} DT</strong></article>
              <article><span>COD</span><strong>{money(viewedShipment.cod_amount)} DT</strong></article>
              <article className="application-detail-wide"><span>Description</span><strong>{viewedShipment.description || "-"}</strong></article>
            </div>
            <div className="shipment-actions">
              <button type="button" className="primary-button" onClick={() => { closeAdminDialog(); openShipmentEditor(viewedShipment) }}>
                Modifier
              </button>
              <button type="button" className="secondary-button" onClick={() => printShipment(viewedShipment)}>
                Imprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {adminDialog?.type === "user-form" ? (
        <div className="modal-backdrop" onClick={closeAdminDialog}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Utilisateur</p>
                <h2>{editingUserId ? "Modifier la fiche" : "Nouveau formulaire"}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={closeAdminDialog}>
                Fermer
              </button>
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
              <div className="shipment-actions">
                <button type="submit" className="primary-button" disabled={busyAction === "user"}>
                  {busyAction === "user" ? "Enregistrement..." : editingUserId ? "Mettre a jour" : "Creer"}
                </button>
                <button type="button" className="secondary-button" onClick={() => { resetUserForm(); closeAdminDialog() }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {adminDialog?.type === "user-view" && viewedUser ? (
        <div className="modal-backdrop" onClick={closeAdminDialog}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Consultation</p>
                <h2>{viewedUser.full_name}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={closeAdminDialog}>
                Fermer
              </button>
            </div>
            <div className="application-detail-grid">
              <article><span>Role</span><strong>{roleLabel(viewedUser.role)}</strong></article>
              <article><span>Email</span><strong>{viewedUser.email}</strong></article>
              <article><span>Telephone</span><strong>{viewedUser.phone || "-"}</strong></article>
              <article><span>Gouvernorat</span><strong>{viewedUser.governorate || "-"}</strong></article>
              <article><span>Adresse</span><strong>{viewedUser.address || "-"}</strong></article>
              <article><span>Vehicule</span><strong>{viewedUser.vehicle || "-"}</strong></article>
              <article><span>Statut</span><strong>{viewedUser.status || "-"}</strong></article>
              <article><span>Note</span><strong>{Number(viewedUser.rating ?? 0).toFixed(1)}</strong></article>
            </div>
            <div className="shipment-actions">
              <button type="button" className="primary-button" onClick={() => { closeAdminDialog(); openEditUser(viewedUser) }}>
                Modifier
              </button>
              <button type="button" className="secondary-button" onClick={() => printUser(viewedUser)}>
                Imprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {adminDialog?.type === "settings" ? (
        <div className="modal-backdrop" onClick={closeAdminDialog}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Parametres de la societe</p>
                <h2>{adminDialog.mode === "edit" ? "Modifier les parametres" : "Consulter les parametres"}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={closeAdminDialog}>
                Fermer
              </button>
            </div>

            {adminDialog.mode === "edit" ? (
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
                  </div>
                  <div className="mini-card">
                    <strong>Statuts additionnels</strong>
                    <div className="shipment-status-editor">
                      {shipmentStatusesForm.length ? shipmentStatusesForm.map((status, index) => (
                        <div key={`${status.key}-${index}`} className="shipment-status-row">
                          <input value={status.label} onChange={(event) => handleShipmentStatusLabelChange(index, event.target.value)} />
                          <span className="shipment-status-key">{slugifyStatusLabel(status.label) || "cle_auto"}</span>
                          <button type="button" className="ghost-button" onClick={() => handleRemoveShipmentStatus(index)}>
                            Supprimer
                          </button>
                        </div>
                      )) : <span>Aucun statut additionnel configure.</span>}
                    </div>
                    <div className="shipment-status-add">
                      <input value={newShipmentStatusLabel} placeholder="Ex: Refuse" onChange={(event) => setNewShipmentStatusLabel(event.target.value)} />
                      <button type="button" className="secondary-button" onClick={handleAddShipmentStatus}>Ajouter</button>
                    </div>
                  </div>
                </div>
                <div className="shipment-actions">
                  <button type="submit" className="primary-button" disabled={busyAction === "settings"}>
                    {busyAction === "settings" ? "Mise a jour..." : "Enregistrer"}
                  </button>
                  <button type="button" className="secondary-button" onClick={printSettingsOverview}>
                    Imprimer
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="admin-record-list">
                  {companySettingsRecords.map((item) => (
                    <article key={item.id} className="mini-card admin-record-card">
                      <div className="admin-record-main">
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.subtitle}</p>
                        </div>
                        <span className="admin-record-meta">{item.note}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="shipment-actions">
                  <button type="button" className="primary-button" onClick={() => openSettingsDialog("edit")}>
                    Modifier
                  </button>
                  <button type="button" className="secondary-button" onClick={printSettingsOverview}>
                    Imprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {adminDialog?.type === "application-view" && viewedApplication ? (
        <div className="modal-backdrop" onClick={closeAdminDialog}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Candidature</p>
                <h2>{viewedApplication.applicationType === "driver" ? viewedApplication.full_name : viewedApplication.business_name}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={closeAdminDialog}>
                Fermer
              </button>
            </div>

            <div className="application-detail-grid">
              {viewedApplication.applicationType === "driver" ? (
                <>
                  <article><span>Nom complet</span><strong>{viewedApplication.full_name}</strong></article>
                  <article><span>Email</span><strong>{viewedApplication.email}</strong></article>
                  <article><span>Telephone</span><strong>{viewedApplication.phone}</strong></article>
                  <article><span>Gouvernorat</span><strong>{viewedApplication.governorate}</strong></article>
                  <article><span>Adresse</span><strong>{viewedApplication.address || "-"}</strong></article>
                  <article><span>Vehicule</span><strong>{viewedApplication.vehicle}</strong></article>
                  <article><span>Experience</span><strong>{viewedApplication.experience || "-"}</strong></article>
                  <article className="application-detail-wide"><span>Notes</span><strong>{viewedApplication.notes || "-"}</strong></article>
                </>
              ) : (
                <>
                  <article><span>Entreprise</span><strong>{viewedApplication.business_name}</strong></article>
                  <article><span>Contact</span><strong>{viewedApplication.contact_name}</strong></article>
                  <article><span>Email</span><strong>{viewedApplication.email}</strong></article>
                  <article><span>Telephone</span><strong>{viewedApplication.phone}</strong></article>
                  <article><span>Gouvernorat</span><strong>{viewedApplication.governorate}</strong></article>
                  <article><span>Adresse</span><strong>{viewedApplication.address || "-"}</strong></article>
                  <article><span>Activite</span><strong>{viewedApplication.activity || "-"}</strong></article>
                  <article><span>Colis / jour</span><strong>{viewedApplication.average_shipments}</strong></article>
                  <article className="application-detail-wide"><span>Notes</span><strong>{viewedApplication.notes || "-"}</strong></article>
                </>
              )}
            </div>

            <div className="application-actions-row">
              <button
                type="button"
                className="primary-button"
                disabled={busyAction === `application-${viewedApplication.applicationType}-${viewedApplication.id}-approved`}
                onClick={() => handleApplicationDecision(viewedApplication.applicationType, viewedApplication.id, "approved")}
              >
                Valider
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={busyAction === `application-${viewedApplication.applicationType}-${viewedApplication.id}-pending`}
                onClick={() => handleApplicationDecision(viewedApplication.applicationType, viewedApplication.id, "pending")}
              >
                Mettre en attente
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={busyAction === `application-${viewedApplication.applicationType}-${viewedApplication.id}-rejected`}
                onClick={() => handleApplicationDecision(viewedApplication.applicationType, viewedApplication.id, "rejected")}
              >
                Refuser
              </button>
              <button type="button" className="secondary-button" onClick={() => printApplication({
                ...viewedApplication,
                title: viewedApplication.applicationType === "driver" ? viewedApplication.full_name : viewedApplication.business_name,
                subtitle: viewedApplication.applicationType === "driver" ? viewedApplication.vehicle : viewedApplication.contact_name
              })}>
                Imprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
