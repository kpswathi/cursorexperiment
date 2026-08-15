import { Link } from 'react-router-dom'
import { useData } from '@/context/DataProvider'

export default function ResearchPage() {
  const { index } = useData()
  const labs = index?.researchLabs ?? []
  const areas = index?.researchAreas ?? []

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-2xl">Research</h1>
      <p className="mb-5 text-sm text-mist">Labs and focus areas attached to the company graph.</p>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Focus areas</h2>
      <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <div key={area.id} className="border border-line p-3">
            <div className="text-sm">{area.name}</div>
            <div className="mt-1 text-xs text-mist">{area.description}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Labs</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {labs.map((lab) => {
          const company = index?.companies.find((item) => item.id === lab.companyId)
          return (
            <div key={lab.id} className="border border-line bg-panel p-4">
              <div className="text-lg">{lab.name}</div>
              <div className="text-xs text-mist">
                {lab.city ? `${lab.city}, ` : ''}
                {lab.countryId}
              </div>
              <p className="mt-2 text-sm text-mist">{lab.description}</p>
              {company ? (
                <Link to={`/companies/${company.slug}`} className="mt-3 inline-block text-sm text-accent">
                  {company.name}
                </Link>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
