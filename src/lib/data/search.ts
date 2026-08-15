import Fuse from 'fuse.js'
import type { Company, DataIndex, Founder, Model, SearchHit } from '@/types'

export function buildSearchIndex(
  index: DataIndex,
  companies: Company[],
  models: Model[],
  founders: Founder[],
) {
  const rows: SearchHit[] = []

  for (const company of companies) {
    rows.push({
      type: 'company',
      id: company.id,
      slug: company.slug,
      title: company.name,
      subtitle: `${company.headquarters} · ${company.countryId}`,
      href: `/companies/${company.slug}`,
    })
    for (const product of [...company.consumerProducts, ...company.enterpriseProducts]) {
      rows.push({
        type: 'product',
        id: product.id,
        slug: company.slug,
        title: product.name,
        subtitle: `${company.name} · ${product.kind}`,
        href: `/companies/${company.slug}`,
      })
    }
  }

  for (const model of models) {
    const company = index.companies.find((item) => item.id === model.companyId)
    rows.push({
      type: 'model',
      id: model.id,
      slug: model.slug,
      title: model.name,
      subtitle: `${company?.name ?? model.companyId} · ${model.family}`,
      href: `/models/${model.slug}`,
    })
  }

  for (const founder of founders) {
    rows.push({
      type: 'founder',
      id: founder.id,
      slug: founder.slug,
      title: founder.name,
      subtitle: founder.title ?? 'Founder',
      href: `/founders/${founder.slug}`,
    })
  }

  for (const country of index.countries.filter((item) => item.enabled || item.companyCount > 0)) {
    rows.push({
      type: 'country',
      id: country.id,
      slug: country.id.toLowerCase(),
      title: country.name,
      subtitle: `${country.companyCount} companies`,
      href: `/countries/${country.id.toLowerCase()}`,
    })
  }

  for (const item of index.news.slice(0, 80)) {
    rows.push({
      type: 'news',
      id: item.id,
      title: item.title,
      subtitle: item.source,
      href: `/news#${item.id}`,
    })
  }

  return new Fuse(rows, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'subtitle', weight: 0.3 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
  })
}
