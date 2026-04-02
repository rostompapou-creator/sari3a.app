"use client"

import Link from "next/link"
import { useState } from "react"
import { Sari3aLogo } from "./Sari3aLogo"

const driverTemplate = {
  full_name: "",
  email: "",
  phone: "",
  governorate: "Tunis",
  address: "",
  vehicle: "Moto",
  experience: "",
  notes: ""
}

const partnerTemplate = {
  business_name: "",
  contact_name: "",
  email: "",
  phone: "",
  governorate: "Tunis",
  address: "",
  activity: "",
  average_shipments: "20",
  notes: ""
}

export function LandingExperience({ stats, settings, governorates }) {
  const [activeForm, setActiveForm] = useState(null)
  const [driverForm, setDriverForm] = useState(driverTemplate)
  const [partnerForm, setPartnerForm] = useState(partnerTemplate)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function send(path, payload) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || "Envoi impossible")
    return body
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      if (activeForm === "driver") {
        await send("/api/applications/driver", driverForm)
        setDriverForm(driverTemplate)
        setMessage("Votre candidature livreur a ete envoyee.")
      }

      if (activeForm === "partner") {
        await send("/api/applications/partner", partnerForm)
        setPartnerForm(partnerTemplate)
        setMessage("Votre demande partenaire a ete envoyee.")
      }

      setActiveForm(null)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="landing-shell">
      <header className="landing-topbar">
        <div className="brand-stack">
          <Sari3aLogo compact />
          <p className="header-caption">Plateforme livraison Tunisie</p>
        </div>
        <div className="landing-top-actions">
          <Link href="/login/client" className="primary-button">Entrer dans la plateforme</Link>
          <Link href="/login/driver" className="secondary-button">Acces Livreur</Link>
          <Link href="/login/admin" className="secondary-button">Voir l'espace admin</Link>
          <button type="button" className="secondary-button" onClick={() => setActiveForm("driver")}>Devenir Livreur</button>
          <button type="button" className="secondary-button" onClick={() => setActiveForm("partner")}>Devenir Partenaire</button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-mobile-badges">
            <span>GPS live</span>
            <span>4 portails</span>
            <span>Tunisie</span>
          </div>
          <h1 className="landing-hero-title">{settings.hero_title}</h1>
          <p className="hero-text">{settings.hero_description}</p>
          <div className="support-line">
            <span>{settings.tagline}</span>
            <span>{settings.support_phone}</span>
            <span>{settings.support_email}</span>
          </div>
          {message ? <p className="flash-message success">{message}</p> : null}
          {error ? <p className="flash-message error">{error}</p> : null}
          <div className="stats-grid landing-stats">
            <article className="stat-card">
              <span>Colis demo</span>
              <strong>{stats.shipmentsToday}</strong>
            </article>
            <article className="stat-card">
              <span>Livreurs actifs</span>
              <strong>{stats.driversOnline}</strong>
            </article>
            <article className="stat-card">
              <span>Partenaires</span>
              <strong>{stats.partners}</strong>
            </article>
            <article className="stat-card">
              <span>Taux livres</span>
              <strong>{stats.deliveredRate}%</strong>
            </article>
          </div>
        </div>

        <div className="landing-visual glass-card">
          <div className="wing-ornament" aria-hidden="true" />
          <div className="landing-logo-stage">
            <div className="landing-logo-large">
              <Sari3aLogo />
            </div>
            <p className="landing-logo-caption">Plateforme de livraison rapide pour la Tunisie</p>
          </div>
        </div>
      </section>

      {activeForm ? (
        <section className="modal-backdrop" onClick={() => setActiveForm(null)}>
          <div className="modal-card glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Candidature</p>
                <h2>{activeForm === "driver" ? "Devenir Livreur" : "Devenir Partenaire"}</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setActiveForm(null)}>Fermer</button>
            </div>

            <form className="stack-form dense" onSubmit={handleSubmit}>
              {activeForm === "driver" ? (
                <>
                  <div className="grid-two">
                    <label>
                      Nom complet
                      <input value={driverForm.full_name} onChange={(event) => setDriverForm((current) => ({ ...current, full_name: event.target.value }))} required />
                    </label>
                    <label>
                      Email
                      <input type="email" value={driverForm.email} onChange={(event) => setDriverForm((current) => ({ ...current, email: event.target.value }))} required />
                    </label>
                  </div>
                  <div className="grid-two">
                    <label>
                      Telephone
                      <input value={driverForm.phone} onChange={(event) => setDriverForm((current) => ({ ...current, phone: event.target.value }))} required />
                    </label>
                    <label>
                      Gouvernorat
                      <select value={driverForm.governorate} onChange={(event) => setDriverForm((current) => ({ ...current, governorate: event.target.value }))}>
                        {governorates.map((governorate) => (
                          <option key={governorate} value={governorate}>{governorate}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid-two">
                    <label>
                      Adresse
                      <input value={driverForm.address} onChange={(event) => setDriverForm((current) => ({ ...current, address: event.target.value }))} />
                    </label>
                    <label>
                      Vehicule
                      <input value={driverForm.vehicle} onChange={(event) => setDriverForm((current) => ({ ...current, vehicle: event.target.value }))} required />
                    </label>
                  </div>
                  <label>
                    Experience
                    <input value={driverForm.experience} onChange={(event) => setDriverForm((current) => ({ ...current, experience: event.target.value }))} />
                  </label>
                  <label>
                    Notes
                    <textarea rows="3" value={driverForm.notes} onChange={(event) => setDriverForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </>
              ) : (
                <>
                  <div className="grid-two">
                    <label>
                      Nom de l'entreprise
                      <input value={partnerForm.business_name} onChange={(event) => setPartnerForm((current) => ({ ...current, business_name: event.target.value }))} required />
                    </label>
                    <label>
                      Contact
                      <input value={partnerForm.contact_name} onChange={(event) => setPartnerForm((current) => ({ ...current, contact_name: event.target.value }))} required />
                    </label>
                  </div>
                  <div className="grid-two">
                    <label>
                      Email
                      <input type="email" value={partnerForm.email} onChange={(event) => setPartnerForm((current) => ({ ...current, email: event.target.value }))} required />
                    </label>
                    <label>
                      Telephone
                      <input value={partnerForm.phone} onChange={(event) => setPartnerForm((current) => ({ ...current, phone: event.target.value }))} required />
                    </label>
                  </div>
                  <div className="grid-two">
                    <label>
                      Gouvernorat
                      <select value={partnerForm.governorate} onChange={(event) => setPartnerForm((current) => ({ ...current, governorate: event.target.value }))}>
                        {governorates.map((governorate) => (
                          <option key={governorate} value={governorate}>{governorate}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Activite
                      <input value={partnerForm.activity} onChange={(event) => setPartnerForm((current) => ({ ...current, activity: event.target.value }))} />
                    </label>
                  </div>
                  <div className="grid-two">
                    <label>
                      Adresse
                      <input value={partnerForm.address} onChange={(event) => setPartnerForm((current) => ({ ...current, address: event.target.value }))} />
                    </label>
                    <label>
                      Colis / jour
                      <input type="number" value={partnerForm.average_shipments} onChange={(event) => setPartnerForm((current) => ({ ...current, average_shipments: event.target.value }))} />
                    </label>
                  </div>
                  <label>
                    Notes
                    <textarea rows="3" value={partnerForm.notes} onChange={(event) => setPartnerForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </>
              )}

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer la candidature"}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </main>
  )
}
