import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TimelineEvent } from '@/types'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/shared/Badge'
import { cn } from '@/lib/cn'

const TONE: Record<TimelineEvent['type'], 'default' | 'accent' | 'gold' | 'muted' | 'danger'> = {
  founded: 'gold',
  funding: 'accent',
  model: 'accent',
  product: 'gold',
  research: 'muted',
  milestone: 'default',
  news: 'default',
  leadership: 'muted',
}

export function Timeline({ events, onSelect }: { events: TimelineEvent[]; onSelect?: (event: TimelineEvent) => void }) {
  const [active, setActive] = useState<TimelineEvent | null>(null)
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  function open(event: TimelineEvent) {
    setActive(event)
    onSelect?.(event)
  }

  return (
    <div>
      <ol className="relative space-y-0 border-l border-line pl-5">
        {sorted.map((event) => (
          <li key={event.id} className="relative pb-6">
            <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border border-accent bg-ink" />
            <button type="button" onClick={() => open(event)} className="w-full text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-mist">{formatDate(event.date)}</span>
                <Badge tone={TONE[event.type]}>{event.type}</Badge>
              </div>
              <div className="mt-1 text-sm text-paper">{event.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-mist">{event.description}</p>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence>
        {active ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-lg border border-line bg-panel p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone={TONE[active.type]}>{active.type}</Badge>
                  <h3 className="mt-3 text-xl text-paper">{active.title}</h3>
                  <p className="mt-1 font-mono text-xs text-mist">{formatDate(active.date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="font-mono text-xs uppercase tracking-widest text-mist hover:text-paper"
                >
                  Close
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-paper/85">{active.description}</p>
              {active.url ? (
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-accent"
                >
                  Open source ↗
                </a>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function TimelineCompact({ events, className }: { events: TimelineEvent[]; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...events]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
        .map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="w-16 shrink-0 font-mono text-[11px] text-mist">{event.date.slice(0, 4)}</div>
            <div>
              <div className="text-sm text-paper">{event.title}</div>
              <div className="text-xs text-mist">{event.description}</div>
            </div>
          </div>
        ))}
    </div>
  )
}
