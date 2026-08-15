import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'gold' | 'muted' | 'danger'
  className?: string
}) {
  const tones = {
    default: 'border-line text-paper/90',
    accent: 'border-accent/40 text-accent',
    gold: 'border-gold/40 text-gold',
    muted: 'border-line text-mist',
    danger: 'border-signal/40 text-signal',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
