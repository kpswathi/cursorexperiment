import type { Capabilities, CapabilityName } from '@/types'
import { CAPABILITY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/cn'

const NAMES = Object.keys(CAPABILITY_LABELS) as CapabilityName[]

export function CapabilityGrid({
  capabilities,
  compact = false,
}: {
  capabilities: Capabilities
  compact?: boolean
}) {
  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
      {NAMES.map((name) => (
        <CapabilityBar key={name} name={name} value={capabilities[name]} />
      ))}
    </div>
  )
}

export function CapabilityBar({ name, value }: { name: CapabilityName; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
        <span>{CAPABILITY_LABELS[name]}</span>
        <span className="text-paper">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1',
              index < value ? (value >= 4 ? 'bg-accent' : 'bg-gold') : 'bg-line',
            )}
          />
        ))}
      </div>
    </div>
  )
}
