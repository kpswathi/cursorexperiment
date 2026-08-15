import { Link, useParams } from 'react-router-dom'
import { useData } from '@/context/DataProvider'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { Stat } from '@/components/shared/Stat'
import { formatNumber } from '@/lib/format'
import { REGION_LABELS } from '@/lib/constants'

export default function CountryPage() {
  const { id } = useParams()
  const { index, companies, models } = useData()
  const country = index?.countries.find((item) => item.id.toLowerCase() === id?.toLowerCase())

  if (!country) return <div className="p-8 text-mist">Country not found.</div>

  const localCompanies = companies.filter((item) => item.countryId === country.id)
  const localModels = models.filter((item) => localCompanies.some((company) => company.id === item.companyId))

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{REGION_LABELS[country.regionId]}</div>
      <h1 className="mt-1 text-3xl">{country.name}</h1>
      <p className="mt-3 max-w-3xl text-sm text-mist">{country.description}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Stat label="Companies" value={formatNumber(localCompanies.length)} />
        <Stat label="Models" value={formatNumber(localModels.length)} />
        <Stat label="Activity score" value={formatNumber(country.activityScore)} />
      </div>
      <h2 className="mb-3 mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Companies</h2>
      {localCompanies.length === 0 ? (
        <div className="border border-dashed border-line p-6 text-sm text-mist">
          No companies seeded yet. Add a JSON file under data/companies/ with countryId {country.id}.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {localCompanies.map((company) => (
            <Link key={company.id} to={`/companies/${company.slug}`} className="flex gap-3 border border-line p-3 hover:border-accent/40">
              <EntityLogo src={company.logo} alt={company.name} size={36} />
              <div>
                <div>{company.name}</div>
                <div className="text-xs text-mist">{company.headquarters}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
