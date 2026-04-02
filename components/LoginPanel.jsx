"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DEMO_ACCOUNTS, PORTAL_ACCENTS } from "../lib/constants"
import { Sari3aLogo } from "./Sari3aLogo"

export function LoginPanel({ role, demoEnabled }) {
  const router = useRouter()
  const demo = DEMO_ACCOUNTS[role]
  const [form, setForm] = useState({
    email: demoEnabled ? demo.email : "",
    password: demoEnabled ? demo.password : ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role })
    })

    const body = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(body.message || "Connexion impossible")
      return
    }

    router.push(`/${role}`)
    router.refresh()
  }

  return (
    <main className="login-screen">
      <section className="login-showcase">
        <div className="login-showcase-inner">
          <Sari3aLogo />
          <p className="eyebrow">Livre vite, livre bien</p>
          <h1>Portail {role === "driver" ? "Livreur" : role === "partner" ? "Partenaire" : role === "admin" ? "Admin" : "Client"}</h1>
          <p>{PORTAL_ACCENTS[role]}</p>
          <div className="showcase-metrics">
            <article>
              <strong>GPS Live</strong>
              <span>Leaflet + suivi colis/livreurs</span>
            </article>
            <article>
              <strong>Acces securise</strong>
              <span>Sessions protegees et donnees locales</span>
            </article>
            <article>
              <strong>4 Portails</strong>
              <span>Client, Livreur, Partenaire, Admin</span>
            </article>
          </div>
        </div>
      </section>

      <section className="login-card-wrap">
        <div className="login-card">
          <div className="login-card-header">
            <p className="eyebrow">Connexion securisee</p>
            <h2>Accedez a votre espace</h2>
            <p>
              {demoEnabled
                ? `Les champs sont deja pre-remplis pour un test immediat avec ${demo.email}.`
                : "Saisissez les identifiants de votre compte pour acceder a la plateforme."}
            </p>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </label>
            <label>
              Mot de passe
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="login-footer-links">
            <Link href="/">Retour a l'accueil</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
