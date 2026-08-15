import { Link, useParams } from 'react-router-dom'
import { useData, useModel } from '@/context/DataProvider'
import { Badge } from '@/components/shared/Badge'
import { CapabilityGrid } from '@/components/shared/CapabilityGrid'
import { Stat } from '@/components/shared/Stat'
import { OPEN_CLOSED_LABELS } from '@/lib/constants'
import { formatContext, formatDate } from '@/lib/format'

export default function ModelDetailPage() {
  const { slug } = useParams()
  const model = useModel(slug)
  const { companies, models, index } = useData()

  if (!model) return <div className="p-8 text-mist">Model not found in the local dataset.</div>

  const company = companies.find((item) => item.id === model.companyId)
  const previous = models.find((item) => item.id === model.previousModelId)
  const next = models.find((item) => item.previousModelId === model.id)
  const scores = (index?.benchmarkScores ?? []).filter((item) => item.modelId === model.id)
  const family = models
    .filter((item) => item.companyId === model.companyId && item.family === model.family)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-line bg-panel px-6 py-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">Model dossier</div>
        <h1 className="mt-1 text-3xl">{model.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-mist">
          {company ? (
            <Link to={`/companies/${company.slug}`} className="text-accent">
              {company.name}
            </Link>
          ) : null}
          <span>· {model.family}</span>
          <span>· {formatDate(model.releaseDate)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={model.openClosed === 'closed' ? 'default' : 'accent'}>{OPEN_CLOSED_LABELS[model.openClosed]}</Badge>
          <Badge>{model.apiAvailable ? 'API available' : 'No public API'}</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-paper/85">{model.description}</p>
      </div>

      <div className="grid gap-3 p-6 md:grid-cols-3">
        <Stat label="Release" value={formatDate(model.releaseDate)} />
        <Stat label="Context" value={formatContext(model.contextWindow)} />
        <Stat label="Family" value={model.family} />
      </div>

      <div className="grid gap-6 px-6 pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Capabilities</h2>
            <CapabilityGrid capabilities={model.capabilities} />
          </section>
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">What is new</h2>
            <p className="border border-line bg-raised/40 p-4 text-sm leading-6">{model.whatsNew}</p>
            {previous ? (
              <div className="mt-3 text-sm text-mist">
                Previous version:{' '}
                <Link to={`/models/${previous.slug}`} className="text-accent">
                  {previous.name}
                </Link>
              </div>
            ) : null}
            {next ? (
              <div className="text-sm text-mist">
                Successor:{' '}
                <Link to={`/models/${next.slug}`} className="text-accent">
                  {next.name}
                </Link>
              </div>
            ) : null}
          </section>
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Family line</h2>
            <ol className="space-y-2">
              {family.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/models/${item.slug}`}
                    className={`flex justify-between border px-3 py-2 ${item.id === model.id ? 'border-accent text-accent' : 'border-line hover:border-accent/40'}`}
                  >
                    <span>{item.name}</span>
                    <span className="font-mono text-xs text-mist">{formatDate(item.releaseDate)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Benchmark improvements</h2>
            {scores.length ? (
              <div className="space-y-2">
                {scores.map((score) => {
                  const bench = index?.benchmarks.find((item) => item.id === score.benchmarkId)
                  const prior = previous
                    ? index?.benchmarkScores.find(
                        (item) => item.modelId === previous.id && item.benchmarkId === score.benchmarkId,
                      )
                    : undefined
                  const delta = prior ? score.score - prior.score : null
                  return (
                    <div key={score.id} className="border border-line px-3 py-2">
                      <div className="flex justify-between text-sm">
                        <span>{bench?.name ?? score.benchmarkId}</span>
                        <span className="font-mono">
                          {score.score}
                          {score.unit === 'percent' ? '%' : ''}
                        </span>
                      </div>
                      <div className="text-xs text-mist">
                        {bench?.category}
                        {delta !== null ? ` · ${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs ${previous?.name}` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="border border-dashed border-line p-3 text-sm text-mist">No benchmark rows recorded yet.</div>
            )}
          </section>
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Links</h2>
            <div className="space-y-2 text-sm">
              {model.announcementUrl ? (
                <a className="block text-accent" href={model.announcementUrl} target="_blank" rel="noreferrer">
                  Official announcement ↗
                </a>
              ) : null}
              {model.paperUrl ? (
                <a className="block text-accent" href={model.paperUrl} target="_blank" rel="noreferrer">
                  Paper ↗
                </a>
              ) : null}
              {model.huggingFaceUrl ? (
                <a className="block text-accent" href={model.huggingFaceUrl} target="_blank" rel="noreferrer">
                  Hugging Face ↗
                </a>
              ) : null}
              {model.githubUrl ? (
                <a className="block text-accent" href={model.githubUrl} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
