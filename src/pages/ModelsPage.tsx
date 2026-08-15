import { Link } from 'react-router-dom'
import { FilterBar } from '@/components/filters/FilterBar'
import { Badge } from '@/components/shared/Badge'
import { useData } from '@/context/DataProvider'
import { useFilters } from '@/context/FilterProvider'
import { companyMatches } from '@/lib/data/filters'
import { OPEN_CLOSED_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/format'

export default function ModelsPage() {
  const { index, models } = useData()
  const { filters } = useFilters()
  const allowedCompanies = new Set(
    (index?.companies ?? [])
      .filter((company) => companyMatches(company, { ...filters, query: '' }, index?.models ?? []))
      .map((company) => company.id),
  )
  const visible = models.filter((model) => {
    if (!allowedCompanies.has(model.companyId)) return false
    if (filters.modelFamily && model.family !== filters.modelFamily) return false
    if (filters.capabilities.length && !filters.capabilities.every((name) => model.capabilities[name] >= 3)) {
      return false
    }
    if (filters.openSource && model.openClosed === 'closed') return false
    if (filters.closedSource && model.openClosed !== 'closed') return false
    if (filters.query) {
      const q = filters.query.toLowerCase()
      if (!`${model.name} ${model.family}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="h-full overflow-y-auto p-5">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Models</h1>
          <p className="text-sm text-mist">Foundation-model catalog, newest first.</p>
        </div>
        <FilterBar dense />
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((model) => {
          const company = index?.companies.find((item) => item.id === model.companyId)
          return (
            <Link key={model.id} to={`/models/${model.slug}`} className="border border-line bg-panel p-4 hover:border-accent/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg">{model.name}</div>
                  <div className="text-xs text-mist">{company?.name} · {model.family}</div>
                </div>
                <Badge tone={model.openClosed === 'closed' ? 'default' : 'accent'}>
                  {OPEN_CLOSED_LABELS[model.openClosed]}
                </Badge>
              </div>
              <div className="mt-3 font-mono text-xs text-mist">{formatDate(model.releaseDate)}</div>
              <p className="mt-2 line-clamp-3 text-sm text-mist">{model.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
