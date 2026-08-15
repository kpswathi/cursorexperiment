import type {
  Company,
  Country,
  DataIndex,
  Founder,
  Model,
  NewsItem,
  ResearchArea,
  ResearchLab,
} from '@/types'

const BASE = `${import.meta.env.BASE_URL}data`

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}/${path}`)
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`)
  }
  return response.json() as Promise<T>
}

export function loadIndex() {
  return fetchJson<DataIndex>('index.json')
}

export function loadCompany(id: string) {
  return fetchJson<Company>(`companies/${id}.json`)
}

export function loadModel(id: string) {
  return fetchJson<Model>(`models/${id}.json`)
}

export function loadFounder(id: string) {
  return fetchJson<Founder>(`founders/${id}.json`)
}

export function loadCountry(id: string) {
  return fetchJson<Country>(`countries/${id.toLowerCase()}.json`)
}

export function loadNews(id: string) {
  return fetchJson<NewsItem>(`news/${id}.json`).catch(() =>
    fetchJson<NewsItem>(`news/generated/${id}.json`),
  )
}

export function loadResearchArea(id: string) {
  return fetchJson<ResearchArea>(`research/${id}.json`)
}

export function loadResearchLab(id: string) {
  return fetchJson<ResearchLab>(`research/${id}.json`)
}

export async function hydrateAll(index: DataIndex) {
  const [companies, models, founders, news] = await Promise.all([
    Promise.all(index.companies.map((item) => loadCompany(item.id))),
    Promise.all(index.models.map((item) => loadModel(item.id))),
    Promise.all(index.founders.map((item) => loadFounder(item.id))),
    Promise.all(
      index.news.map((item) =>
        loadNews(item.id).catch(() => null),
      ),
    ),
  ])

  return {
    companies,
    models,
    founders,
    news: news.filter((item): item is NewsItem => item !== null),
  }
}
