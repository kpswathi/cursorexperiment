import type { CapabilityName, OpenClosed, RegionId } from '@/types'

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'

export const REGION_LABELS: Record<RegionId, string> = {
  'north-america': 'North America',
  europe: 'Europe',
  china: 'China',
  india: 'India',
  'middle-east': 'Middle East',
  japan: 'Japan',
  korea: 'Korea',
  'southeast-asia': 'Southeast Asia',
  'latin-america': 'Latin America',
}

export const PRIMARY_REGIONS: RegionId[] = [
  'north-america',
  'europe',
  'china',
  'india',
]

export const CAPABILITY_LABELS: Record<CapabilityName, string> = {
  reasoning: 'Reasoning',
  coding: 'Coding',
  vision: 'Vision',
  audio: 'Audio',
  video: 'Video',
  imageGeneration: 'Image gen',
  longContext: 'Long context',
  agentSupport: 'Agents',
}

export const OPEN_CLOSED_LABELS: Record<OpenClosed, string> = {
  open: 'Open',
  'open-weights': 'Open weights',
  closed: 'Closed',
}

export const EMPTY_FILTERS = {
  regionId: null,
  countryId: null,
  companyId: null,
  modelFamily: null,
  capabilities: [] as CapabilityName[],
  openSource: null,
  closedSource: null,
  consumer: null,
  enterprise: null,
  query: '',
}
