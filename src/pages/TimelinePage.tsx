import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useData } from '@/context/DataProvider'
import { Timeline } from '@/components/shared/Timeline'
import type { TimelineEvent } from '@/types'

export default function TimelinePage() {
  const { companies, models, index } = useData()
  const [companyId, setCompanyId] = useState('')

  const events = useMemo(() => {
    const rows: TimelineEvent[] = []
    for (const company of companies) {
      if (companyId && company.id !== companyId) continue
      rows.push(...company.timeline.map((event) => ({ ...event, companyId: company.id })))
    }
    for (const model of models) {
      if (companyId && model.companyId !== companyId) continue
      rows.push({
        id: `model-${model.id}`,
        date: model.releaseDate,
        title: model.name,
        description: model.whatsNew,
        type: 'model',
        companyId: model.companyId,
        modelId: model.id,
        url: model.announcementUrl,
      })
    }
    for (const round of index?.funding ?? []) {
      if (companyId && round.companyId !== companyId) continue
      rows.push({
        id: `fund-${round.id}`,
        date: round.date,
        title: `${round.round} · ${companies.find((c) => c.id === round.companyId)?.name ?? round.companyId}`,
        description: round.notes ?? (round.leadInvestors[0] ? `Led by ${round.leadInvestors.join(', ')}` : 'Financing round'),
        type: 'funding',
        companyId: round.companyId,
        fundingId: round.id,
      })
    }
    const seen = new Set<string>()
    return rows
      .filter((event) => {
        const key = `${event.date}-${event.title}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [companies, models, index, companyId])

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Timeline</h1>
          <p className="text-sm text-mist">A merged history of founding, models, funding and product launches. Click any node.</p>
        </div>
        <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="select">
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <div className="max-w-3xl">
        <Timeline events={events} />
      </div>
      <p className="mt-6 text-xs text-mist">
        Company pages keep an editorial timeline; this view also folds in model releases and financing rows.{' '}
        <Link to="/" className="text-accent">
          Back to map
        </Link>
      </p>
    </div>
  )
}
