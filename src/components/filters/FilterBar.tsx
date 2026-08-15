import type { CapabilityName } from '@/types'
import { CAPABILITY_LABELS, PRIMARY_REGIONS, REGION_LABELS } from '@/lib/constants'
import { useData } from '@/context/DataProvider'
import { useFilters } from '@/context/FilterProvider'
import { cn } from '@/lib/cn'

const CAPS = Object.keys(CAPABILITY_LABELS) as CapabilityName[]

export function FilterBar({ dense = false }: { dense?: boolean }) {
  const { index } = useData()
  const { filters, setFilters, clear } = useFilters()
  const families = Array.from(new Set(index?.models.map((model) => model.family) ?? [])).sort()
  const countries = (index?.countries ?? []).filter((country) => country.companyCount > 0)

  return (
    <div className={cn('flex flex-wrap items-center gap-2', dense ? 'text-xs' : 'text-sm')}>
      <select
        value={filters.regionId ?? ''}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, regionId: (event.target.value || null) as typeof prev.regionId, countryId: null }))
        }
        className="select"
      >
        <option value="">All regions</option>
        {PRIMARY_REGIONS.map((id) => (
          <option key={id} value={id}>
            {REGION_LABELS[id]}
          </option>
        ))}
        <option value="middle-east">{REGION_LABELS['middle-east']}</option>
      </select>

      <select
        value={filters.countryId ?? ''}
        onChange={(event) => setFilters((prev) => ({ ...prev, countryId: event.target.value || null }))}
        className="select"
      >
        <option value="">All countries</option>
        {countries.map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>

      <select
        value={filters.companyId ?? ''}
        onChange={(event) => setFilters((prev) => ({ ...prev, companyId: event.target.value || null }))}
        className="select"
      >
        <option value="">All companies</option>
        {(index?.companies ?? []).map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>

      <select
        value={filters.modelFamily ?? ''}
        onChange={(event) => setFilters((prev) => ({ ...prev, modelFamily: event.target.value || null }))}
        className="select"
      >
        <option value="">Model family</option>
        {families.map((family) => (
          <option key={family} value={family}>
            {family}
          </option>
        ))}
      </select>

      <select
        value={filters.capabilities[0] ?? ''}
        onChange={(event) =>
          setFilters((prev) => ({
            ...prev,
            capabilities: event.target.value ? [event.target.value as CapabilityName] : [],
          }))
        }
        className="select"
      >
        <option value="">Capability</option>
        {CAPS.map((name) => (
          <option key={name} value={name}>
            {CAPABILITY_LABELS[name]}
          </option>
        ))}
      </select>

      <Toggle
        label="Open"
        active={filters.openSource}
        onClick={() => setFilters((prev) => ({ ...prev, openSource: prev.openSource ? null : true }))}
      />
      <Toggle
        label="Closed"
        active={filters.closedSource}
        onClick={() => setFilters((prev) => ({ ...prev, closedSource: prev.closedSource ? null : true }))}
      />
      <Toggle
        label="Consumer"
        active={filters.consumer}
        onClick={() => setFilters((prev) => ({ ...prev, consumer: prev.consumer ? null : true }))}
      />
      <Toggle
        label="Enterprise"
        active={filters.enterprise}
        onClick={() => setFilters((prev) => ({ ...prev, enterprise: prev.enterprise ? null : true }))}
      />
      <button type="button" onClick={clear} className="font-mono text-[10px] uppercase tracking-widest text-mist hover:text-paper">
        Reset
      </button>
    </div>
  )
}

function Toggle({ label, active, onClick }: { label: string; active: boolean | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
        active ? 'border-accent text-accent' : 'border-line text-mist hover:text-paper',
      )}
    >
      {label}
    </button>
  )
}
