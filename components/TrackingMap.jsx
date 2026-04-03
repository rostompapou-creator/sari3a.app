"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { TRACKING_LABELS, TUNISIA_CENTER } from "../lib/constants"

function badgeIcon(label, tone) {
  return L.divIcon({
    className: "map-pin-wrapper",
    html: `<div class="map-pin map-pin-${tone}">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  })
}

function MapLayoutFix() {
  const map = useMap()

  useEffect(() => {
    const refresh = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize()
      })
    }

    refresh()
    const timeoutId = window.setTimeout(refresh, 180)
    window.addEventListener("resize", refresh)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener("resize", refresh)
    }
  }, [map])

  return null
}

export default function TrackingMap({ shipments = [], drivers = [], selectedShipmentId = null }) {
  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId) ?? shipments[0]

  const center = useMemo(() => {
    if (selectedShipment?.current_lat && selectedShipment?.current_lng) {
      return [selectedShipment.current_lat, selectedShipment.current_lng]
    }
    if (drivers[0]?.current_lat && drivers[0]?.current_lng) {
      return [drivers[0].current_lat, drivers[0].current_lng]
    }
    return TUNISIA_CENTER
  }, [drivers, selectedShipment])

  const routePath = selectedShipment
    ? [
        [selectedShipment.pickup_lat, selectedShipment.pickup_lng],
        [selectedShipment.current_lat, selectedShipment.current_lng],
        [selectedShipment.delivery_lat, selectedShipment.delivery_lng]
      ]
    : []

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={7} scrollWheelZoom className="map-canvas">
        <MapLayoutFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shipments.map((shipment) => (
          <Marker
            key={`shipment-${shipment.id}`}
            position={[shipment.current_lat ?? shipment.pickup_lat, shipment.current_lng ?? shipment.pickup_lng]}
            icon={badgeIcon("C", shipment.id === selectedShipmentId ? "gold" : "navy")}
          >
            <Popup>
              <strong>{shipment.tracking_number}</strong>
              <br />
              {shipment.title}
              <br />
              {TRACKING_LABELS[shipment.status] ?? shipment.status}
            </Popup>
          </Marker>
        ))}

        {drivers
          .filter((driver) => driver.current_lat && driver.current_lng)
          .map((driver) => (
            <Marker key={`driver-${driver.id}`} position={[driver.current_lat, driver.current_lng]} icon={badgeIcon("L", "cream")}>
              <Popup>
                <strong>{driver.full_name}</strong>
                <br />
                {driver.vehicle}
              </Popup>
            </Marker>
          ))}

        {routePath.length === 3 ? <Polyline positions={routePath} pathOptions={{ color: "#d6a328", weight: 5, opacity: 0.7 }} /> : null}
      </MapContainer>
    </div>
  )
}
