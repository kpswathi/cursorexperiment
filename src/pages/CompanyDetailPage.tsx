import { Link, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useCompany, useData } from '@/context/DataProvider'
import { useCompare } from '@/context/CompareProvider'
import { Badge } from '@/components/shared/Badge'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { Stat } from '@/components/shared/Stat'
import { Timeline } from '@/components/shared/Timeline'
import { CapabilityGrid } from '@/components/shared/CapabilityGrid'
import { formatDate, formatNumber, formatUsd } from '@/lib/format'
import { REGION_LABELS } from '@/lib/constants'

export default function CompanyDetailPage() {
  const { slug } = useParams()
  const company = useCompany(slug)
  const { models, founders, index, news } = useData()
  const { toggle, ids } = useCompare()

  if (!company) {
    return <Missing label="Company" />
  }

  const people = founders.filter((item) => company.founderIds.includes(item.id))
  const ceo = founders.find((item) => item.id === company.ceoId)
  const companyModels = models
    .filter((item) => item.companyId === company.id)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
  const latest = models.find((item) => item.id === company.latestModelId)
  const rounds = (index?.funding ?? []).filter((item) => item.companyId === company.id)
  const country = index?.countries.find((item) => item.id === company.countryId)
  const announcement = news.find((item) => item.id === company.latestNewsId)
  const areas = (index?.researchAreas ?? []).filter((item) => company.researchAreaIds.includes(item.id))

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-line bg-panel px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <EntityLogo src={company.logo} alt={company.name} size={64} />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">Company dossier</div>
              <h1 className="mt-1 text-3xl">{company.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-mist">{company.longDescription}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>{company.headquarters}</Badge>
                <Badge>{country?.name ?? company.countryId}</Badge>
                <Badge tone="muted">{REGION_LABELS[company.regionId]}</Badge>
                {company.openSource ? <Badge tone="accent">Open / open-weights</Badge> : null}
                {company.closedSource ? <Badge>Closed</Badge> : null}
                {company.consumer ? <Badge tone="gold">Consumer</Badge> : null}
                {company.enterprise ? <Badge>Enterprise</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggle(company.id)}
              className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-widest hover:text-accent"
            >
              {ids.includes(company.id) ? 'In compare' : 'Add to compare'}
            </button>
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="border border-accent/40 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-accent"
            >
              Website
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Founded" value={formatDate(company.founded)} />
        <Stat label="Employees" value={formatNumber(company.employees)} hint={company.employeesAsOf} />
        <Stat label="Funding" value={formatUsd(company.totalFundingUsd)} />
        <Stat label="Valuation" value={formatUsd(company.valuationUsd)} hint={company.valuationAsOf} />
      </div>

      <div className="grid gap-6 px-6 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <section>
            <SectionTitle>Latest frontier model</SectionTitle>
            {latest ? (
              <Link to={`/models/${latest.slug}`} className="block border border-line p-4 hover:border-accent/40">
                <div className="text-lg">{latest.name}</div>
                <div className="text-sm text-mist">
                  {formatDate(latest.releaseDate)} · {latest.family} · {latest.openClosed}
                </div>
                <div className="mt-4">
                  <CapabilityGrid capabilities={latest.capabilities} />
                </div>
              </Link>
            ) : (
              <Empty>No public model released.</Empty>
            )}
          </section>

          <section>
            <SectionTitle>Model timeline</SectionTitle>
            <div className="space-y-2">
              {companyModels.map((model) => (
                <Link
                  key={model.id}
                  to={`/models/${model.slug}`}
                  className="flex items-center justify-between border border-line px-3 py-2 hover:border-accent/40"
                >
                  <span>{model.name}</span>
                  <span className="font-mono text-xs text-mist">{formatDate(model.releaseDate)}</span>
                </Link>
              ))}
              {companyModels.length === 0 ? <Empty>Stealth — no public models.</Empty> : null}
            </div>
          </section>

          <section>
            <SectionTitle>Company history</SectionTitle>
            <Timeline events={company.timeline} />
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle>Leadership</SectionTitle>
            {ceo ? (
              <Link to={`/founders/${ceo.slug}`} className="mb-3 flex items-center gap-3 border border-line p-3">
                <EntityLogo src={ceo.photo} alt={ceo.name} size={40} className="rounded-full" />
                <div>
                  <div>CEO · {ceo.name}</div>
                  <div className="text-xs text-mist">{ceo.title}</div>
                </div>
              </Link>
            ) : (
              <Empty>No named CEO in dataset (public company / parent-led).</Empty>
            )}
            <div className="space-y-2">
              {people.map((person) => (
                <Link key={person.id} to={`/founders/${person.slug}`} className="flex items-center gap-3 hover:text-accent">
                  <EntityLogo src={person.photo} alt={person.name} size={28} className="rounded-full" />
                  <span className="text-sm">{person.name}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Investors</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {company.investors.map((name) => (
                <Badge key={name} tone="muted">
                  {name}
                </Badge>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {rounds.map((round) => (
                <div key={round.id} className="border border-line px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span>{round.round}</span>
                    <span className="font-mono">{formatUsd(round.amountUsd)}</span>
                  </div>
                  <div className="text-xs text-mist">
                    {formatDate(round.date)}
                    {round.valuationUsd ? ` · val ${formatUsd(round.valuationUsd)}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Products</SectionTitle>
            <ProductList title="Consumer" items={company.consumerProducts} />
            <ProductList title="Enterprise" items={company.enterpriseProducts} />
          </section>

          <section>
            <SectionTitle>Research areas</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {areas.map((area) => (
                <Badge key={area.id}>{area.name}</Badge>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Latest announcement</SectionTitle>
            {announcement ? (
              <a href={announcement.url} target="_blank" rel="noreferrer" className="block border border-line p-3 hover:border-accent/40">
                <div className="text-sm">{announcement.title}</div>
                <div className="mt-1 text-xs text-mist">{formatDate(announcement.date)}</div>
              </a>
            ) : (
              <Empty>No linked announcement.</Empty>
            )}
          </section>

          <section className="text-xs text-mist">
            Coordinates {company.coordinates.lat.toFixed(3)}, {company.coordinates.lng.toFixed(3)} · {company.legalName}
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{children}</h2>
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="border border-dashed border-line p-3 text-sm text-mist">{children}</div>
}

function Missing({ label }: { label: string }) {
  return <div className="p-8 text-mist">{label} not found in the local dataset.</div>
}

function ProductList({
  title,
  items,
}: {
  title: string
  items: { id: string; name: string; description: string; url?: string }[]
}) {
  if (!items.length) return null
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs text-mist">{title}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="border border-line px-3 py-2">
            <div className="text-sm">{item.name}</div>
            <div className="text-xs text-mist">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
