import "leaflet/dist/leaflet.css"
import "./globals.css"

export const metadata = {
  title: "Sari3a Delivery",
  description: "Plateforme de livraison multi-portails pour la Tunisie."
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
