import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'ai-compass-compare'

interface CompareContextValue {
  ids: string[]
  toggle: (id: string) => void
  setIds: (ids: string[]) => void
  clear: () => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

function readStored(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIdsState] = useState<string[]>(readStored)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [ids])

  const setIds = useCallback((next: string[]) => {
    setIdsState(Array.from(new Set(next)).slice(0, 4))
  }, [])

  const toggle = useCallback((id: string) => {
    setIdsState((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id)
      return [...prev, id].slice(-4)
    })
  }, [])

  const value = useMemo(
    () => ({ ids, toggle, setIds, clear: () => setIdsState([]) }),
    [ids, toggle, setIds],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
