"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Sari3aLogo } from "./Sari3aLogo"

export function DeliveryScanCard({ shipment, trackingNumber, statusLabel, sessionRole, sessionName }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [currentStatusLabel, setCurrentStatusLabel] = useState(statusLabel)
  const [isDelivered, setIsDelivered] = useState(shipment?.status === "delivered")

  async function handleConfirmDelivery() {
    if (!shipment || isDelivered) return
    setBusy(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/shipments/confirm-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trackingNumber: shipment.tracking_number })
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || "Impossible de confirmer la livraison.")

      setCurrentStatusLabel("Livre")
      setIsDelivered(true)
      setMessage("Livraison confirmee avec succes apres scan du QR code.")
      router.refresh()
    } catch (scanError) {
      setError(scanError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="scan-shell">
      <section className="scan-card glass-card">
        <div className="scan-header">
          <Sari3aLogo compact />
          <div className="scan-header-copy">
            <p className="eyebrow">Scan de livraison</p>
            <h1>Confirmation du colis</h1>
            <p>Le QR code ouvre directement cette page pour aider le livreur a confirmer la livraison sur mobile.</p>
          </div>
        </div>

        {shipment ? (
          <>
            <div className="scan-status-row">
              <span className="role-badge">Tracking {shipment.tracking_number}</span>
              <span className="secondary-button scan-status-pill">{currentStatusLabel}</span>
            </div>

            <div className="scan-grid">
              <article>
                <span>Destinataire</span>
                <strong>{shipment.recipient_name}</strong>
              </article>
              <article>
                <span>Telephone</span>
                <strong>{shipment.recipient_phone || "-"}</strong>
              </article>
              <article className="scan-grid-wide">
                <span>Adresse</span>
                <strong>{shipment.recipient_address || "-"}</strong>
              </article>
              <article>
                <span>Gouvernorat</span>
                <strong>{shipment.governorate || "-"}</strong>
              </article>
              <article>
                <span>Ville / zone</span>
                <strong>{shipment.city || "-"}</strong>
              </article>
              <article>
                <span>Partenaire</span>
                <strong>{shipment.partner_name || "-"}</strong>
              </article>
              <article>
                <span>Livreur</span>
                <strong>{shipment.driver_name || "-"}</strong>
              </article>
            </div>

            {message ? <p className="flash-message success">{message}</p> : null}
            {error ? <p className="flash-message error">{error}</p> : null}

            <div className="scan-actions">
              {sessionRole ? (
                <>
                  <span className="scan-session-note">Connecte en tant que {sessionName} ({sessionRole}).</span>
                  <button type="button" className="primary-button" disabled={busy || isDelivered} onClick={handleConfirmDelivery}>
                    {isDelivered ? "Livraison deja confirmee" : busy ? "Confirmation..." : "Confirmer la livraison"}
                  </button>
                </>
              ) : (
                <>
                  <span className="scan-session-note">Connectez-vous comme livreur, partenaire ou admin pour valider la livraison.</span>
                  <div className="scan-login-actions">
                    <Link className="primary-button" href="/login/driver">
                      Connexion livreur
                    </Link>
                    <Link className="secondary-button" href="/login/admin">
                      Connexion admin
                    </Link>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="mini-card">
            <strong>Colis introuvable</strong>
            <span>{trackingNumber ? `Aucun colis ne correspond au tracking ${trackingNumber}.` : "Aucun tracking n'a ete fourni."}</span>
          </div>
        )}
      </section>
    </main>
  )
}
