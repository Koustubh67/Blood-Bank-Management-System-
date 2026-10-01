import { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { RiderState } from '@/services/admin/types'
import type { RiderView } from '@/services/admin/dispatch'
import { RIDER_STATE_LABEL } from '@/services/admin/dispatch'
import { storesIn, shortStoreName } from '@/services/admin/stores'
import { hospitalName } from '@/services/admin/store'
import { initials } from '@/services/admin/names'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'

const COLOR: Partial<Record<RiderState, string>> = {
  to_pickup: '#d97706',
  on_the_way: 'var(--color-blood-600)',
  returning: 'var(--color-ice-600)',
}

const iconCache = new Map<string, L.DivIcon>()
function riderDot(state: RiderState, label: string) {
  const key = `${state}:${label}`
  let icon = iconCache.get(key)
  if (!icon) {
    icon = L.divIcon({
      className: 'rider-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `<div style="width:30px;height:30px;border-radius:999px;display:grid;place-items:center;background:${COLOR[state] ?? '#4f4743'};color:white;font:700 10px/1 Inter Variable,system-ui;border:2px solid white;box-shadow:0 6px 14px -4px rgb(0 0 0/.45)">${label}</div>`,
    })
    iconCache.set(key, icon)
  }
  return icon
}

/** Stores and every rider who is moving, for the selected city. Loaded lazily with Leaflet. */
export default function DispatchMap({ scope, views, className }: { scope: string; views: RiderView[]; className?: string }) {
  const stores = useMemo(() => storesIn(scope), [scope])
  const free = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of views) if (v.state === 'available') m.set(v.store.id, (m.get(v.store.id) ?? 0) + 1)
    return m
  }, [views])
  const markers = useMemo<MapMarker[]>(
    () =>
      stores.map((s) => ({
        id: s.id,
        position: s.location,
        kind: s.kind === 'centre' ? 'centre' : 'outlet',
        label: `${shortStoreName(s)} · ${free.get(s.id) ?? 0} free rider${free.get(s.id) === 1 ? '' : 's'}`,
      })),
    [stores, free],
  )
  const fitTo = useMemo(() => stores.map((s) => s.location), [stores])
  const moving = views.filter((v) => v.state === 'to_pickup' || v.state === 'on_the_way' || v.state === 'returning')

  return (
    <LiveMap markers={markers} fitTo={fitTo} className={className}>
      {moving.map((v) => (
        <Marker key={v.rider.id} position={v.position} icon={riderDot(v.state, initials(v.rider.name))} zIndexOffset={800}>
          <Tooltip direction="top" offset={[0, -16]}>
            {v.rider.name} · {RIDER_STATE_LABEL[v.state]}
            {v.order ? ` · ${v.order.id} → ${hospitalName(v.order)}` : ''}
          </Tooltip>
        </Marker>
      ))}
    </LiveMap>
  )
}
