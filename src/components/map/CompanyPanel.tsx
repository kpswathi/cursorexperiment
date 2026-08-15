import { Link } from 'react-router-dom'
import { ExternalLink, GitCompare, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useData, useCompany } from '@/context/DataProvider'
import { useCompare } from '@/context/CompareProvider'
import { formatNumber, formatUsd, formatYear } from '@/lib/format'
import { Badge } from '@/components/shared/Badge'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { TimelineCompact } from '@/components/shared/Timeline'
import { CapabilityGrid } from '@/components/shared/CapabilityGrid'

export function CompanyPanel({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const company = useCompany(companyId)
  const { models, founders, index } = useData()
  const { toggle, ids } = useCompare()

  if (!company) return null
  const latest = models.find((model) => model.id === company.latestModelId)
  const people = founders.filter((founder) => company.founderIds.includes(founder.id))
  const country = index?.countries.find((item) => item.id === company.countryId)

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="flex h-full w-full max-w-md flex-col border-l border-line bg-panel/95 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="flex gap-3">
          <EntityLogo src={company.logo} alt={company.name} size={44} />
          <div>
            <div className="text-lg text-paper">{company.name}</div>
            <div className="text-xs text-mist">
              {company.headquarters} · {country?.name ?? company.countryId}
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-mist hover:text-paper">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <p className="text-sm leading-6 text-paper/85">{company.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {company.openSource ? <Badge tone="accent">Open</Badge> : null}
          {company.closedSource ? <Badge>Closed</Badge> : null}
          {company.consumer ? <Badge tone="gold">Consumer</Badge> : null}
          {company.enterprise ? <Badge>Enterprise</Badge> : null}
          <Badge tone="muted">{company.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Founded" value={formatYear(company.founded)} />
          <MiniStat label="Employees" value={formatNumber(company.employees)} />
          <MiniStat label="Funding" value={formatUsd(company.totalFundingUsd)} />
          <MiniStat label="Valuation" value={formatUsd(company.valuationUsd)} />
        </div>
        {latest ? (
          <div className="border border-line p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mist">Latest frontier model</div>
            <Link to={`/models/${latest.slug}`} className="mt-1 block text-paper hover:text-accent">
              {latest.name}
            </Link>
            <div className="mt-3">
              <CapabilityGrid capabilities={latest.capabilities} compact />
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-line p-3 text-sm text-mist">No public frontier model yet.</div>
        )}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mist">Founders</div>
          <div className="space-y-2">
            {people.map((person) => (
              <Link key={person.id} to={`/founders/${person.slug}`} className="flex items-center gap-2 hover:text-accent">
                <EntityLogo src={person.photo} alt={person.name} size={28} className="rounded-full" />
                <span className="text-sm">{person.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mist">Timeline</div>
          <TimelineCompact events={company.timeline} />
        </div>
      </div>

      <div className="flex gap-2 border-t border-line p-4">
        <Link
          to={`/companies/${company.slug}`}
          className="flex-1 border border-accent/40 px-3 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-accent"
        >
          Full dossier
        </Link>
        <button
          type="button"
          onClick={() => toggle(company.id)}
          className="border border-line px-3 py-2 text-mist hover:text-paper"
          title="Compare"
        >
          <GitCompare size={16} className={ids.includes(company.id) ? 'text-accent' : ''} />
        </button>
        <a href={company.website} target="_blank" rel="noreferrer" className="border border-line px-3 py-2 text-mist hover:text-paper">
          <ExternalLink size={16} />
        </a>
      </div>
    </motion.aside>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line/80 bg-raised/50 px-2.5 py-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-mist">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  )
}
