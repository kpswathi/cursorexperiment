import { Link } from 'react-router-dom'
import { FilterBar } from '@/components/filters/FilterBar'
import { Badge } from '@/components/shared/Badge'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { useData } from '@/context/DataProvider'
import { useFilters } from '@/context/FilterProvider'
import { useCompare } from '@/context/CompareProvider'
import { companyMatches } from '@/lib/data/filters'
import { formatNumber, formatUsd, formatYear } from '@/lib/format'

export default function CompaniesPage() {
  const { index, companies } = useData()
  const { filters } = useFilters()
  const { toggle, ids } = useCompare()
  const visible = (index?.companies ?? []).filter((company) =>
    companyMatches(company, filters, index?.models ?? []),
  )

  return (
    <div className="h-full overflow-y-auto p-5">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Companies</h1>
          <p className="text-sm text-mist">Frontier labs in the current filter set.</p>
        </div>
        <FilterBar dense />
      </header>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-raised font-mono text-[10px] uppercase tracking-widest text-mist">
            <tr>
              {['Company', 'HQ', 'Founded', 'People', 'Funding', 'Valuation', 'Latest model', ''].map((label) => (
                <th key={label} className="px-3 py-2 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const company = companies.find((item) => item.id === row.id)
              const model = index?.models.find((item) => item.id === row.latestModelId)
              return (
                <tr key={row.id} className="border-t border-line hover:bg-raised/40">
                  <td className="px-3 py-2">
                    <Link to={`/companies/${row.slug}`} className="flex items-center gap-2 hover:text-accent">
                      <EntityLogo src={row.logo} alt={row.name} size={28} />
                      <span>{row.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-mist">{company?.headquarters ?? row.countryId}</td>
                  <td className="px-3 py-2 font-mono">{formatYear(row.founded)}</td>
                  <td className="px-3 py-2 font-mono">{formatNumber(row.employees)}</td>
                  <td className="px-3 py-2 font-mono">{formatUsd(row.totalFundingUsd)}</td>
                  <td className="px-3 py-2 font-mono">{formatUsd(row.valuationUsd)}</td>
                  <td className="px-3 py-2">
                    {model ? (
                      <Link to={`/models/${model.slug}`} className="hover:text-accent">
                        {model.name}
                      </Link>
                    ) : (
                      <span className="text-mist">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggle(row.id)}
                      className="font-mono text-[10px] uppercase tracking-widest text-mist hover:text-accent"
                    >
                      {ids.includes(row.id) ? 'Added' : 'Compare'}
                    </button>
                    {row.openSource ? <Badge tone="accent" className="ml-2">Open</Badge> : <Badge className="ml-2">Closed</Badge>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
