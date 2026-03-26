export const THEME = {
  navy: "#081a44",
  navySoft: "#11295f",
  navyDeep: "#050f2a",
  gold: "#d6a328",
  goldSoft: "#f1d17b",
  ivory: "#f7f1e4"
}

export const PORTALS = [
  {
    role: "client",
    label: "Client",
    href: "/login/client",
    description: "Suivi instantane, historique et details de livraison."
  },
  {
    role: "driver",
    label: "Livreur",
    href: "/login/driver",
    description: "Colis assignes, actions rapides et navigation GPS."
  },
  {
    role: "partner",
    label: "Partenaire",
    href: "/login/partner",
    description: "CRUD colis, gestion des livreurs et analytics."
  },
  {
    role: "admin",
    label: "Admin",
    href: "/login/admin",
    description: "Vision globale, supervision et administration."
  }
]

export const DEMO_ACCOUNTS = {
  client: {
    email: "client@sari3a.tn",
    password: "demo123",
    title: "Compte demo client"
  },
  driver: {
    email: "livreur@sari3a.tn",
    password: "demo123",
    title: "Compte demo livreur"
  },
  partner: {
    email: "partenaire@sari3a.tn",
    password: "demo123",
    title: "Compte demo partenaire"
  },
  admin: {
    email: "admin@sari3a.tn",
    password: "Aziz*1993*1993",
    title: "Compte demo admin"
  }
}

export const GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Beja",
  "Jendouba",
  "Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabes",
  "Medenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kebili"
]

export const STATUS_STEPS = [
  { key: "pending", label: "En attente" },
  { key: "picked_up", label: "Recupere chez le partenaire" },
  { key: "sorting", label: "En tri" },
  { key: "in_transit", label: "En transit" },
  { key: "out_for_delivery", label: "En livraison" },
  { key: "delivered", label: "Livre" }
]

export const TRACKING_LABELS = Object.fromEntries(STATUS_STEPS.map((step) => [step.key, step.label]))

export const STATUS_COLORS = {
  pending: "status-pending",
  picked_up: "status-picked_up",
  sorting: "status-sorting",
  in_transit: "status-in_transit",
  out_for_delivery: "status-out_for_delivery",
  delivered: "status-delivered",
  cancelled: "status-cancelled"
}

export const PORTAL_ACCENTS = {
  client: "Concu pour les expediteurs qui veulent tout voir sans effort.",
  driver: "Pilotez votre tournee et mettez a jour les etapes en un clic.",
  partner: "Gardez la maitrise complete de vos flux logistiques.",
  admin: "Surveillez l'ecosysteme Sari3a en temps reel."
}

export const TUNISIA_CENTER = [34.1246, 9.5361]

export const DEFAULT_CITIES = {
  Tunis: ["Centre Ville", "Lac 1", "La Marsa", "Carthage"],
  Ariana: ["Ariana Ville", "Ennasr", "Raoued"],
  "Ben Arous": ["Ben Arous", "Megrine", "Ezzahra"],
  Sousse: ["Sahloul", "Khzema", "Hammam Sousse"],
  Sfax: ["Sfax Ville", "Sakiet Ezzit", "Thyna"],
  Nabeul: ["Nabeul Ville", "Hammamet", "Dar Chaabane"],
  Monastir: ["Monastir Ville", "Ksibet", "Moknine"]
}
