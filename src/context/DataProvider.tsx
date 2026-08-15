import { createContext, useContext, type ReactNode, useEffect, useMemo, useState } from 'react'
import type { Company, DataIndex, Founder, Model, NewsItem } from '@/types'
import { hydrateAll, loadIndex } from '@/lib/data/client'

interface DataState {
  index: DataIndex | null
  companies: Company[]
  models: Model[]
  founders: Founder[]
  news: NewsItem[]
  loading: boolean
  error: string | null
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    index: null,
    companies: [],
    models: [],
    founders: [],
    news: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const index = await loadIndex()
        if (cancelled) return
        setState((prev) => ({ ...prev, index, loading: true }))
        const hydrated = await hydrateAll(index)
        if (cancelled) return
        setState({
          index,
          companies: hydrated.companies,
          models: hydrated.models,
          founders: hydrated.founders,
          news: hydrated.news,
          loading: false,
          error: null,
        })
      } catch (error) {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load data',
        }))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => state, [state])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function useCompany(idOrSlug: string | undefined) {
  const { companies } = useData()
  return companies.find((item) => item.id === idOrSlug || item.slug === idOrSlug)
}

export function useModel(idOrSlug: string | undefined) {
  const { models } = useData()
  return models.find((item) => item.id === idOrSlug || item.slug === idOrSlug)
}

export function useFounder(idOrSlug: string | undefined) {
  const { founders } = useData()
  return founders.find((item) => item.id === idOrSlug || item.slug === idOrSlug)
}
