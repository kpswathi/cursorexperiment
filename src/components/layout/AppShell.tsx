import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  Compass,
  GitCompare,
  Globe2,
  Layers3,
  Newspaper,
  Sparkles,
  Users,
} from 'lucide-react'
import { CommandSearch } from '@/components/search/CommandSearch'
import { useData } from '@/context/DataProvider'
import { useCompare } from '@/context/CompareProvider'
import { formatNumber, formatUsd } from '@/lib/format'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/', label: 'Map', icon: Globe2, end: true },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/models', label: 'Models', icon: Layers3 },
  { to: '/founders', label: 'Founders', icon: Users },
  { to: '/timeline', label: 'Timeline', icon: Sparkles },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/research', label: 'Research', icon: Compass },
]

export function AppShell() {
  const { index, loading, error } = useData()
  const { ids } = useCompare()
  const valuation = (index?.companies ?? []).reduce((sum, company) => sum + (company.valuationUsd ?? 0), 0)

  return (
    <div className="flex h-full bg-ink text-paper">
      <aside className="flex w-16 flex-col items-center border-r border-line bg-panel py-4">
        <NavLink to="/" className="mb-6 font-mono text-[10px] tracking-[0.2em] text-accent">
          AC
        </NavLink>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'relative flex h-10 w-10 items-center justify-center text-mist hover:text-paper',
                  isActive && 'bg-raised text-accent',
                )
              }
            >
              <item.icon size={18} />
              {item.to === '/compare' && ids.length > 0 ? (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold" />
              ) : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-line bg-panel/80 px-4 py-2.5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">AI Compass</div>
            <div className="text-[11px] text-mist">Frontier intelligence graph</div>
          </div>
          <div className="flex-1">
            <CommandSearch />
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <HeaderStat label="Companies" value={formatNumber(index?.companies.length ?? 0)} />
            <HeaderStat label="Models" value={formatNumber(index?.models.length ?? 0)} />
            <HeaderStat label="Tracked value" value={formatUsd(valuation || null)} />
          </div>
        </header>
        {error ? (
          <div className="border-b border-signal/40 bg-signal/10 px-4 py-2 text-sm text-signal">{error}</div>
        ) : null}
        {loading && !index ? (
          <div className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-widest text-mist">
            Loading intelligence graph…
          </div>
        ) : (
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="font-mono text-[10px] uppercase tracking-widest text-mist">{label}</div>
      <div className="font-mono text-sm text-paper">{value}</div>
    </div>
  )
}
