import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { WorldMap } from '@/components/map/WorldMap'
import { CompanyPanel } from '@/components/map/CompanyPanel'
import { FilterBar } from '@/components/filters/FilterBar'
import { useData } from '@/context/DataProvider'
import { useFilters } from '@/context/FilterProvider'
import { companyMatches } from '@/lib/data/filters'
import { PRIMARY_REGIONS, REGION_LABELS } from '@/lib/constants'
import { cn } from '@/lib/cn'

export default function MapExplorer() {
  const { index } = useData()
  const { filters, setFilters } = useFilters()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const companies = useMemo(() => {
    if (!index) return []
    return index.companies.filter((company) => companyMatches(company, filters, index.models))
  }, [index, filters])

  if (!index) return null

  return (
    <div className="relative h-full">
      <WorldMap
        companies={companies}
        countries={index.countries}
        regions={index.regions}
        selectedId={selectedId}
        focusRegionId={filters.regionId}
        onSelectCompany={(id) => {
          setSelectedId(id)
          setFilters((prev) => ({ ...prev, companyId: id }))
        }}
        onSelectCountry={(id) => {
          setFilters((prev) => ({ ...prev, countryId: prev.countryId === id ? null : id }))
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 p-3">
        <div className="pointer-events-auto border border-line/80 bg-panel/90 p-3 backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {PRIMARY_REGIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, regionId: prev.regionId === id ? null : id, countryId: null }))
                  }
                  className={cn(
                    'border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
                    filters.regionId === id ? 'border-accent text-accent' : 'border-line text-mist hover:text-paper',
                  )}
                >
                  {REGION_LABELS[id]}
                </button>
              ))}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mist">
              {companies.length} companies in view
            </div>
          </div>
          <FilterBar dense />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-3 border border-line bg-panel/90 px-3 py-2 text-[11px] text-mist backdrop-blur">
        <div className="mb-1 font-mono uppercase tracking-widest">AI activity</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-8 bg-[#151b24]" />
          <span>Low</span>
          <span className="h-2 w-8 bg-[#1f4d52]" />
          <span className="h-2 w-8 bg-[#1f8f78]" />
          <span>High</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedId ? (
          <div className="absolute inset-y-0 right-0 w-full max-w-md">
            <CompanyPanel
              companyId={selectedId}
              onClose={() => {
                setSelectedId(null)
                setFilters((prev) => ({ ...prev, companyId: null }))
              }}
            />
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
