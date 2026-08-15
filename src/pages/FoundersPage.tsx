import { Link } from 'react-router-dom'
import { EntityLogo } from '@/components/shared/EntityLogo'
import { useData } from '@/context/DataProvider'

export default function FoundersPage() {
  const { founders, index } = useData()

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-2xl">Founders</h1>
      <p className="mb-5 text-sm text-mist">People who started or scientifically defined the labs in this graph.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {founders.map((founder) => {
          const labs = founder.companyIds
            .map((id) => index?.companies.find((item) => item.id === id)?.name)
            .filter(Boolean)
          return (
            <Link key={founder.id} to={`/founders/${founder.slug}`} className="flex gap-3 border border-line bg-panel p-4 hover:border-accent/40">
              <EntityLogo src={founder.photo} alt={founder.name} size={56} className="rounded-full" />
              <div>
                <div className="text-lg">{founder.name}</div>
                <div className="text-xs text-mist">{founder.title}</div>
                <div className="mt-2 text-sm text-mist">{labs.join(' · ')}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
