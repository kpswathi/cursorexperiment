import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useData } from '@/context/DataProvider'
import { buildSearchIndex } from '@/lib/data/search'
import { cn } from '@/lib/cn'

export function CommandSearch() {
  const { index, companies, models, founders } = useData()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const fuse = useMemo(() => {
    if (!index) return null
    return buildSearchIndex(index, companies, models, founders)
  }, [index, companies, models, founders])

  const hits = useMemo(() => {
    if (!fuse || !query.trim()) return []
    return fuse.search(query.trim()).slice(0, 12).map((row) => row.item)
  }, [fuse, query])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQuery('')
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-[220px] items-center gap-2 border border-line bg-raised/70 px-3 py-1.5 text-left text-sm text-mist hover:border-accent/40"
      >
        <Search size={14} />
        <span className="flex-1">Search companies, models, people</span>
        <kbd className="font-mono text-[10px] text-mist/80">⌘K</kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div
            className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden border border-line bg-panel shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search size={16} className="text-mist" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Companies, models, founders, countries, products…"
                className="w-full bg-transparent py-3 text-sm text-paper outline-none placeholder:text-mist"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {hits.length === 0 ? (
                <div className="px-4 py-6 text-sm text-mist">
                  {query ? 'No matches in the current dataset.' : 'Type to search the full intelligence graph.'}
                </div>
              ) : (
                hits.map((hit) => (
                  <button
                    key={`${hit.type}-${hit.id}`}
                    type="button"
                    onClick={() => {
                      navigate(hit.href)
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-raised"
                  >
                    <div>
                      <div className="text-sm text-paper">{hit.title}</div>
                      <div className="text-xs text-mist">{hit.subtitle}</div>
                    </div>
                    <span className={cn('font-mono text-[10px] uppercase tracking-widest text-accent')}>{hit.type}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
