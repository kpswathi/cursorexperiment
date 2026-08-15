import { Link } from 'react-router-dom'
import { useData } from '@/context/DataProvider'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/shared/Badge'

export default function NewsPage() {
  const { news, index } = useData()
  const items = [...news].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-2xl">News & launches</h1>
      <p className="mb-5 text-sm text-mist">
        Editorial seed items plus generated RSS / GitHub / Hugging Face entries. The UI never calls those APIs.
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <article id={item.id} key={item.id} className="border border-line bg-panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-mist">{formatDate(item.date)}</span>
              <Badge tone={item.generated ? 'muted' : 'gold'}>{item.generated ? 'generated' : 'editorial'}</Badge>
              <Badge>{item.source}</Badge>
            </div>
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block text-lg hover:text-accent">
              {item.title}
            </a>
            <p className="mt-2 text-sm text-mist">{item.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {item.companyIds.map((id) => {
                const company = index?.companies.find((row) => row.id === id)
                return company ? (
                  <Link key={id} to={`/companies/${company.slug}`} className="text-accent">
                    {company.name}
                  </Link>
                ) : null
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
