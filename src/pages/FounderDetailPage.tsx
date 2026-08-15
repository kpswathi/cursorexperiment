import { Link, useParams } from 'react-router-dom'
import { useData, useFounder } from '@/context/DataProvider'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { Timeline } from '@/components/shared/Timeline'
import { Badge } from '@/components/shared/Badge'

export default function FounderDetailPage() {
  const { slug } = useParams()
  const founder = useFounder(slug)
  const { companies } = useData()

  if (!founder) return <div className="p-8 text-mist">Founder not found in the local dataset.</div>

  const labs = companies.filter((item) => founder.companyIds.includes(item.id))

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-line bg-panel px-6 py-6">
        <div className="flex gap-4">
          <EntityLogo src={founder.photo} alt={founder.name} size={88} className="rounded-full" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">Founder dossier</div>
            <h1 className="mt-1 text-3xl">{founder.name}</h1>
            <p className="mt-1 text-sm text-mist">{founder.title}</p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-paper/85">{founder.biography}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Companies founded</h2>
          <div className="space-y-2">
            {labs.map((company) => (
              <Link key={company.id} to={`/companies/${company.slug}`} className="flex items-center gap-3 border border-line p-3 hover:border-accent/40">
                <EntityLogo src={company.logo} alt={company.name} size={32} />
                <div>
                  <div>{company.name}</div>
                  <div className="text-xs text-mist">{company.headquarters}</div>
                </div>
              </Link>
            ))}
          </div>
          <h2 className="mb-3 mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Previous companies</h2>
          <div className="space-y-2">
            {founder.previousCompanies.map((item) => (
              <div key={`${item.name}-${item.role}`} className="border border-line px-3 py-2">
                <div className="text-sm">{item.name}</div>
                <div className="text-xs text-mist">
                  {item.role}
                  {item.years ? ` · ${item.years}` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Research contributions</h2>
          <div className="mb-8 flex flex-col gap-2">
            {founder.researchContributions.map((item) => (
              <Badge key={item} className="w-fit">
                {item}
              </Badge>
            ))}
          </div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Timeline</h2>
          <Timeline events={founder.timeline} />
        </section>
      </div>
    </div>
  )
}
