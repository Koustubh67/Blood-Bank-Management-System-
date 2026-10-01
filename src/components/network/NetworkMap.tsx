import { Polyline, Tooltip } from 'react-leaflet'
import type { LatLng } from '@/types'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'

export interface MapLink {
  id: string
  from: LatLng
  to: LatLng
  /** Shown as a pill at the middle of the line */
  label?: string
  /** The selected outlet → hospital ride; others are drawn faint */
  strong?: boolean
}

/**
 * LiveMap plus straight dashed "as the crow flies" links between an outlet and
 * the hospitals beside it. Lives in its own module so Leaflet loads after the
 * page has painted.
 */
export function NetworkMap({
  markers,
  fitTo,
  links,
  userLocation,
  className,
}: {
  markers: MapMarker[]
  fitTo: LatLng[]
  links: MapLink[]
  userLocation: LatLng | null
  className?: string
}) {
  return (
    <LiveMap markers={markers} fitTo={fitTo} userLocation={userLocation} className={className}>
      {links.map((l) => (
        <Polyline
          // Re-mount when the ends move so the permanent label re-centres.
          key={`${l.id}-${l.from.lat},${l.from.lng}-${l.to.lat},${l.to.lng}`}
          positions={[l.from, l.to]}
          interactive={false}
          pathOptions={
            l.strong
              ? { color: '#c8102e', weight: 5, opacity: 0.95, dashArray: '1 11', lineCap: 'round' }
              : { color: '#c8102e', weight: 3, opacity: 0.45, dashArray: '1 8', lineCap: 'round' }
          }
        >
          {l.label && (
            // Leaflet's own CSS is unlayered, so the overrides need `!`.
            <Tooltip
              permanent
              direction="center"
              className="rounded-full! border-0! bg-ink-950! px-2.5! py-1! font-sans! text-xs! font-semibold! whitespace-nowrap! text-white! shadow-lift!"
            >
              {l.label}
            </Tooltip>
          )}
        </Polyline>
      ))}
    </LiveMap>
  )
}

export default NetworkMap
