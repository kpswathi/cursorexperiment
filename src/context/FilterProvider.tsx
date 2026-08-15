import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FilterState } from '@/types'
import { parseFilters, resetFilters, serializeFilters } from '@/lib/data/filters'

interface FilterContextValue {
  filters: FilterState
  setFilters: (next: FilterState | ((prev: FilterState) => FilterState)) => void
  clear: () => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params.toString()), [params])

  const setFilters = useCallback(
    (next: FilterState | ((prev: FilterState) => FilterState)) => {
      const resolved = typeof next === 'function' ? next(filters) : next
      const serialized = serializeFilters(resolved)
      setParams(serialized, { replace: true })
    },
    [filters, setParams],
  )

  const clear = useCallback(() => {
    setParams(serializeFilters(resetFilters()), { replace: true })
  }, [setParams])

  const value = useMemo(() => ({ filters, setFilters, clear }), [filters, setFilters, clear])
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
