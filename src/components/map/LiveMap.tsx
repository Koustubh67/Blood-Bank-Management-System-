import { useEffect, useMemo, type ReactNode } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng } from '@/types'
import { cn } from '@/lib/utils'
import { useCity } from '@/services/location'

// ---------- icons ----------

const centreSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`
const hospitalSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M10 21v-4h4v4M12 8v4M10 10h4"/></svg>`
const scooterSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 5 20l7-4 7 4z" fill="white"/></svg>`
const glyph = (paths: string, size: number, width = 2.2) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="white" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
const HOSPITAL_PATHS = '<path d="M3 21h18M5 21V7l7-4 7 4v14M10 21v-4h4v4M12 8v4M10 10h4"/>'
// Snowflake: an outlet is a refrigerated blood storage centre.
const OUTLET_PATHS = '<path d="M2 12h20M12 2v20m8-6-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>'

export function centreIcon(active = false) {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:${active ? 'var(--color-blood-600)' : 'var(--color-ink-900)'};box-shadow:0 6px 16px -4px rgb(0 0 0/.35);border:2px solid white">${centreSvg}</div>`,
  })
}

export function hospitalIcon(active = false, compact = false) {
  if (active) {
    return L.divIcon({
      className: '',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      html: `<div style="width:46px;height:46px;border-radius:999px;display:grid;place-items:center;background:var(--color-ice-600);box-shadow:0 0 0 5px rgb(8 145 178/.25),0 10px 22px -6px rgb(0 0 0/.45);border:3px solid white">${glyph(HOSPITAL_PATHS, 20)}</div>`,
    })
  }
  if (compact) {
    return L.divIcon({
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `<div style="width:26px;height:26px;border-radius:999px;display:grid;place-items:center;background:var(--color-ice-600);box-shadow:0 4px 10px -3px rgb(0 0 0/.35);border:2px solid white">${glyph(HOSPITAL_PATHS, 13, 2.4)}</div>`,
    })
  }
  return L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<div style="width:38px;height:38px;border-radius:999px;display:grid;place-items:center;background:var(--color-ice-600);box-shadow:0 6px 16px -4px rgb(0 0 0/.35);border:2px solid white">${hospitalSvg}</div>`,
  })
}

/** RaktFlow outlet (blood storage centre): red rounded square with a snowflake. */
export function outletIcon(active = false) {
  const size = active ? 44 : 34
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:${active ? 14 : 11}px;display:grid;place-items:center;background:var(--color-blood-600);box-shadow:${active ? '0 0 0 5px rgb(200 16 46/.22),0 12px 24px -6px rgb(200 16 46/.6)' : '0 6px 16px -4px rgb(200 16 46/.5)'};border:${active ? 3 : 2}px solid white">${glyph(OUTLET_PATHS, active ? 22 : 17, 2.3)}</div>`,
  })
}

/** Blue "you are here" dot. */
function youIcon() {
  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<div style="position:relative;width:24px;height:24px;display:grid;place-items:center">
      <span style="position:absolute;inset:0;border-radius:999px;background:#2563eb;opacity:.3" class="animate-pulse-ring"></span>
      <span style="position:relative;width:16px;height:16px;border-radius:999px;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgb(37 99 235/.5)"></span>
    </div>`,
  })
}

function riderIcon(heading: number) {
  return L.divIcon({
    className: 'rider-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    html: `<div style="position:relative;width:48px;height:48px;display:grid;place-items:center">
      <span style="position:absolute;inset:0;border-radius:999px;background:var(--color-blood-600);opacity:.25" class="animate-pulse-ring"></span>
      <div style="width:36px;height:36px;border-radius:999px;display:grid;place-items:center;background:var(--color-blood-600);border:3px solid white;box-shadow:0 8px 20px -4px rgb(200 16 46/.6);transform:rotate(${heading}deg)">${scooterSvg}</div>
    </div>`,
  })
}

// ---------- helpers ----------

function FitBounds({ points, padding = 48 }: { points: LatLng[]; padding?: number }) {
  const map = useMap()
  const key = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|')
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [padding, padding] })
    // Only refit when the set of points changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

// ---------- component ----------

export interface MapMarker {
  id: string
  position: LatLng
  kind: 'centre' | 'hospital' | 'outlet'
  label?: string
  active?: boolean
  /** Smaller hospital pin, for maps with many hospitals */
  compact?: boolean
  onClick?: () => void
}

function tooltipOffset(m: MapMarker): [number, number] {
  if (m.kind === 'outlet') return [0, m.active ? -24 : -19]
  if (m.kind === 'hospital' && m.active) return [0, -25]
  if (m.kind === 'hospital' && m.compact) return [0, -14]
  return [0, -18]
}

// Selected and outlet pins sit above the crowd; centres keep Leaflet's default order.
function zIndexFor(m: MapMarker) {
  if (m.kind === 'centre') return 0
  if (m.active) return 900
  return m.kind === 'outlet' ? 400 : 0
}

export function LiveMap({
  markers = [],
  route,
  routeProgress = 0,
  rider,
  userLocation,
  fitTo,
  className,
  interactive = true,
  children,
}: {
  markers?: MapMarker[]
  route?: LatLng[]
  /** 0..1; the travelled part of the route is drawn solid, the rest dashed */
  routeProgress?: number
  rider?: { position: LatLng; heading: number } | null
  /** Pulsing blue "you are here" dot */
  userLocation?: LatLng | null
  /** Points to keep in view. Defaults to all markers. */
  fitTo?: LatLng[]
  className?: string
  interactive?: boolean
  children?: ReactNode
}) {
  // Only the initial view; FitBounds takes over once there are points.
  const cityCenter = useCity().center
  const fitPoints = fitTo ?? markers.map((m) => m.position)

  const [done, todo] = useMemo(() => {
    if (!route || route.length < 2) return [[], []] as [LatLng[], LatLng[]]
    const cut = Math.max(1, Math.round((route.length - 1) * routeProgress))
    return [route.slice(0, cut + 1), route.slice(cut)]
  }, [route, routeProgress])

  const icons = useMemo(
    () => ({
      hospital: hospitalIcon(),
      hospitalActive: hospitalIcon(true),
      hospitalCompact: hospitalIcon(false, true),
      centre: centreIcon(),
      centreActive: centreIcon(true),
      outlet: outletIcon(),
      outletActive: outletIcon(true),
      you: youIcon(),
    }),
    [],
  )
  const iconFor = (m: MapMarker) => {
    if (m.kind === 'outlet') return m.active ? icons.outletActive : icons.outlet
    if (m.kind === 'hospital') return m.active ? icons.hospitalActive : m.compact ? icons.hospitalCompact : icons.hospital
    return m.active ? icons.centreActive : icons.centre
  }
  // Snap heading to 15° steps so the icon isn't rebuilt every tick.
  const headingStep = rider ? Math.round(rider.heading / 15) * 15 : 0
  const riderMarkerIcon = useMemo(() => riderIcon(headingStep), [headingStep])

  return (
    <div className={cn('relative isolate overflow-hidden rounded-3xl', className)}>
      <MapContainer
        center={cityCenter}
        zoom={12}
        className="h-full w-full"
        zoomControl={interactive}
        scrollWheelZoom={false}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        attributionControl
      >
        {/* Keyless Esri light-gray basemap + label overlay; muted so the red route reads first. */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
          maxNativeZoom={16}
          maxZoom={18}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={16}
          maxZoom={18}
        />
        <FitBounds points={fitPoints} />
        {todo.length > 1 && (
          <Polyline positions={todo} pathOptions={{ color: '#9a8e88', weight: 5, opacity: 0.7, dashArray: '2 10', lineCap: 'round' }} />
        )}
        {done.length > 1 && <Polyline positions={done} pathOptions={{ color: '#c8102e', weight: 6, opacity: 0.95, lineCap: 'round' }} />}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            icon={iconFor(m)}
            zIndexOffset={zIndexFor(m)}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}
          >
            {m.label && (
              <Tooltip direction="top" offset={tooltipOffset(m)}>
                {m.label}
              </Tooltip>
            )}
          </Marker>
        ))}
        {userLocation && <Marker position={userLocation} icon={icons.you} zIndexOffset={1100} keyboard={false} interactive={false} />}
        {rider && <Marker position={rider.position} icon={riderMarkerIcon} zIndexOffset={1000} />}
        {children}
      </MapContainer>
    </div>
  )
}
