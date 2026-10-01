import { Square, Zap } from 'lucide-react'
import type { CityScope } from '@/services/admin/types'
import { useRush } from '@/services/admin/engine'
import { Button } from '@/components/ui/Button'
import { startRush, stopRush } from './OpsEngine'

/** Starts the rush-hour demo; while it runs, shows progress and stops it. */
export function RushButton({ scope }: { scope: CityScope }) {
  const rush = useRush()
  return rush.running ? (
    <Button variant="secondary" size="md" icon={<Square className="size-3.5 fill-current" />} onClick={stopRush} aria-live="polite">
      Stop rush · <span className="tabular">{rush.spawned}/{rush.total}</span>
    </Button>
  ) : (
    <Button variant="outline" size="md" icon={<Zap className="size-4" />} onClick={() => startRush(scope)}>
      Simulate rush hour
    </Button>
  )
}
