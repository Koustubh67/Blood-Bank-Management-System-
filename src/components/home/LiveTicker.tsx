import { useMemo, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import type { BloodGroup } from '@/types'
import { BRAND } from '@/config/brand'
import { BLOOD_GROUPS } from '@/data/blood'
import { totalUnits } from '@/data/network'
import { describeEvent, useActivity, useCityCentres, useCityStock } from '@/services/inventory'
import { useCity } from '@/services/location'
import { LiveDot } from '@/components/ui/primitives'
import { cn, formatTime } from '@/lib/utils'

type TickerItem =
  | { key: string; kind: 'group'; group: BloodGroup; units: number }
  | { key: string; kind: 'event'; text: string; received: boolean; at: number }
  | { key: string; kind: 'note'; text: string }

function Item({ item }: { item: TickerItem }) {
  if (item.kind === 'group') {
    return (
      <span className="inline-flex items-baseline gap-2">
        <span className="font-display text-lg font-bold tracking-tight text-white">{item.group}</span>
        <span className={cn('text-sm tabular', item.units === 0 ? 'text-blood-400' : 'text-ink-300')}>
          {item.units === 0 ? 'out of stock' : `${item.units.toLocaleString(BRAND.locale)} units`}
        </span>
      </span>
    )
  }
  if (item.kind === 'event') {
    return (
      <span className="inline-flex items-center gap-2.5 text-sm text-ink-200">
        <span className={cn('size-1.5 rounded-full', item.received ? 'bg-emerald-400' : 'bg-blood-400')} aria-hidden />
        {item.text}
        <span className="text-xs text-ink-500 tabular">{formatTime(item.at)}</span>
      </span>
    )
  }
  return <span className="text-sm text-ink-400">{item.text}</span>
}

/** Scrolling strip with live stock per group in the visitor's city and the latest activity at its centres. */
export function LiveTicker() {
  const city = useCity()
  const stock = useCityStock()
  const centres = useCityCentres()
  const events = useActivity((s) => s.events)
  const [paused, setPaused] = useState(false)

  const items = useMemo<TickerItem[]>(() => {
    const groups: TickerItem[] = BLOOD_GROUPS.map((g) => ({ key: `g-${g}`, kind: 'group', group: g, units: totalUnits(stock, g) }))
    // Only news from this city's centres; other cities' activity would read as local.
    const local = events.flatMap((e) => {
      const centre = centres.find((c) => c.id === e.centreId)
      return centre ? [{ e, name: centre.name }] : []
    })
    const recent: TickerItem[] = local.slice(0, 5).map(({ e, name }) => ({
      key: `e-${e.id}`,
      kind: 'event',
      text: describeEvent(e, name),
      received: e.kind === 'received',
      at: e.at,
    }))
    const feed: TickerItem[] = recent.length
      ? recent
      : [{ key: 'n-sync', kind: 'note', text: `Stock syncs as ${centres.length} licensed centres in ${city.name} log donations and issues` }]
    // Interleave: two groups, then one piece of news.
    const out: TickerItem[] = []
    let f = 0
    groups.forEach((g, i) => {
      out.push(g)
      if (i % 2 === 1 && f < feed.length) out.push(feed[f++])
    })
    while (f < feed.length) out.push(feed[f++])
    return out
  }, [stock, events, centres, city.name])

  const duration = `${Math.max(36, items.length * 5)}s`

  return (
    <section aria-label={`Live stock feed for ${city.name}`} className="relative bg-ink-950 text-white">
      <div className="flex items-stretch">
        <div className="relative z-10 flex shrink-0 items-center gap-2.5 bg-ink-950 py-3.5 pr-4 pl-4 sm:pl-6 lg:pl-8">
          <LiveDot />
          <span className="text-xs font-bold tracking-[0.22em] uppercase">Live</span>
          <span className="hidden text-xs text-ink-400 md:inline">· {city.name} stock</span>
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden mask-[linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
          <div
            className={cn('flex w-max animate-marquee hover:[animation-play-state:paused]', paused && '[animation-play-state:paused]')}
            style={{ animationDuration: duration }}
          >
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center gap-10 py-3.5 pr-10">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center whitespace-nowrap">
                    <Item item={item} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="relative z-10 grid shrink-0 place-items-center bg-ink-950 px-4 text-ink-400 transition-colors hover:text-white sm:px-6 lg:px-8"
          aria-label={paused ? 'Play live ticker' : 'Pause live ticker'}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </section>
  )
}
