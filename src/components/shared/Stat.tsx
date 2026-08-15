import { cn } from '@/lib/cn'

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('border border-line/80 bg-raised/60 px-3 py-2.5', className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{label}</div>
      <div className="mt-1 font-mono text-lg text-paper">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-mist">{hint}</div> : null}
    </div>
  )
}
