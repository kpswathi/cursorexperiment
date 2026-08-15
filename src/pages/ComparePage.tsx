import { Link } from 'react-router-dom'
import { useData } from '@/context/DataProvider'
import { useCompare } from '@/context/CompareProvider'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { CapabilityBar } from '@/components/shared/CapabilityGrid'
import { formatNumber, formatUsd, formatYear } from '@/lib/format'
import { REGION_LABELS } from '@/lib/constants'
import type { CapabilityName, Company } from '@/types'

const CAPS: CapabilityName[] = [
  'reasoning',
  'coding',
  'vision',
  'audio',
  'video',
  'imageGeneration',
  'longContext',
  'agentSupport',
]

export default function ComparePage() {
  const { companies, models } = useData()
  const { ids, toggle, clear } = useCompare()
  const selected = ids
    .map((id) => companies.find((item) => item.id === id))
    .filter((item): item is Company => Boolean(item))

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Compare</h1>
          <p className="text-sm text-mist">Up to four labs. Funding, people, models, capabilities, posture.</p>
        </div>
        <button type="button" onClick={clear} className="font-mono text-[10px] uppercase tracking-widest text-mist">
          Clear set
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => toggle(company.id)}
            className={`border px-2 py-1 text-xs ${ids.includes(company.id) ? 'border-accent text-accent' : 'border-line text-mist'}`}
          >
            {company.name}
          </button>
        ))}
      </div>

      {selected.length < 2 ? (
        <div className="border border-dashed border-line p-8 text-sm text-mist">
          Select at least two companies. The compare set is kept while you browse the map.
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-raised">
                <th className="px-3 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-mist">Field</th>
                {selected.map((company) => (
                  <th key={company.id} className="px-3 py-3 text-left">
                    <Link to={`/companies/${company.slug}`} className="flex items-center gap-2 hover:text-accent">
                      <EntityLogo src={company.logo} alt={company.name} size={28} />
                      {company.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Region" values={selected.map((c) => REGION_LABELS[c.regionId])} />
              <Row label="Founded" values={selected.map((c) => formatYear(c.founded))} />
              <Row label="Employees" values={selected.map((c) => formatNumber(c.employees))} />
              <Row label="Funding" values={selected.map((c) => formatUsd(c.totalFundingUsd))} />
              <Row label="Valuation" values={selected.map((c) => formatUsd(c.valuationUsd))} />
              <Row label="Revenue" values={selected.map((c) => formatUsd(c.revenueUsd))} />
              <Row
                label="Open vs closed"
                values={selected.map((c) => (c.openSource && c.closedSource ? 'Mixed' : c.openSource ? 'Open' : 'Closed'))}
              />
              <Row
                label="Founders"
                values={selected.map((c) => String(c.founderIds.length))}
              />
              <Row
                label="Latest model"
                values={selected.map((c) => models.find((m) => m.id === c.latestModelId)?.name ?? '—')}
              />
              <tr className="border-t border-line">
                <td className="px-3 py-3 align-top font-mono text-[10px] uppercase tracking-widest text-mist">Capabilities</td>
                {selected.map((company) => {
                  const model = models.find((item) => item.id === company.latestModelId)
                  return (
                    <td key={company.id} className="px-3 py-3 align-top">
                      {model ? (
                        <div className="space-y-2">
                          {CAPS.map((name) => (
                            <CapabilityBar key={name} name={name} value={model.capabilities[name]} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-mist">No public model</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-line">
      <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-mist">{label}</td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="px-3 py-3">
          {value}
        </td>
      ))}
    </tr>
  )
}
