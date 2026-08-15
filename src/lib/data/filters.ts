import type { CapabilityName, CompanyIndexItem, FilterState, ModelIndexItem } from '@/types'
import { EMPTY_FILTERS } from '@/lib/constants'

export function parseFilters(search: string): FilterState {
  const params = new URLSearchParams(search)
  const capabilities = (params.get('cap') ?? '')
    .split(',')
    .filter(Boolean) as CapabilityName[]
  return {
    regionId: (params.get('region') as FilterState['regionId']) || null,
    countryId: params.get('country'),
    companyId: params.get('company'),
    modelFamily: params.get('family'),
    capabilities,
    openSource: parseBool(params.get('open')),
    closedSource: parseBool(params.get('closed')),
    consumer: parseBool(params.get('consumer')),
    enterprise: parseBool(params.get('enterprise')),
    query: params.get('q') ?? '',
  }
}

export function serializeFilters(filters: FilterState): string {
  const params = new URLSearchParams()
  if (filters.regionId) params.set('region', filters.regionId)
  if (filters.countryId) params.set('country', filters.countryId)
  if (filters.companyId) params.set('company', filters.companyId)
  if (filters.modelFamily) params.set('family', filters.modelFamily)
  if (filters.capabilities.length) params.set('cap', filters.capabilities.join(','))
  if (filters.openSource !== null) params.set('open', filters.openSource ? '1' : '0')
  if (filters.closedSource !== null) params.set('closed', filters.closedSource ? '1' : '0')
  if (filters.consumer !== null) params.set('consumer', filters.consumer ? '1' : '0')
  if (filters.enterprise !== null) params.set('enterprise', filters.enterprise ? '1' : '0')
  if (filters.query) params.set('q', filters.query)
  return params.toString()
}

export function resetFilters(): FilterState {
  return { ...EMPTY_FILTERS, capabilities: [] }
}

export function companyMatches(company: CompanyIndexItem, filters: FilterState, models: ModelIndexItem[]) {
  if (filters.regionId && company.regionId !== filters.regionId) return false
  if (filters.countryId && company.countryId !== filters.countryId) return false
  if (filters.companyId && company.id !== filters.companyId) return false
  if (filters.openSource && !company.openSource) return false
  if (filters.closedSource && !company.closedSource) return false
  if (filters.consumer && !company.consumer) return false
  if (filters.enterprise && !company.enterprise) return false
  if (filters.modelFamily) {
    const hasFamily = models.some(
      (model) => model.companyId === company.id && model.family === filters.modelFamily,
    )
    if (!hasFamily) return false
  }
  if (filters.capabilities.length) {
    const latest = models.find((model) => model.id === company.latestModelId)
    if (!latest) return false
    const ok = filters.capabilities.every((name) => latest.capabilities[name] >= 3)
    if (!ok) return false
  }
  if (filters.query) {
    const q = filters.query.toLowerCase()
    const hay = `${company.name} ${company.tags.join(' ')} ${company.countryId}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

function parseBool(value: string | null): boolean | null {
  if (value === '1') return true
  if (value === '0') return false
  return null
}
