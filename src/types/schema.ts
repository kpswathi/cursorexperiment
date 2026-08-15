export type RegionId =
  | 'north-america'
  | 'europe'
  | 'china'
  | 'india'
  | 'middle-east'
  | 'japan'
  | 'korea'
  | 'southeast-asia'
  | 'latin-america'

export type CapabilityName =
  | 'reasoning'
  | 'coding'
  | 'vision'
  | 'audio'
  | 'video'
  | 'imageGeneration'
  | 'longContext'
  | 'agentSupport'

export type CapabilityScore = 0 | 1 | 2 | 3 | 4 | 5

export type OpenClosed = 'open' | 'open-weights' | 'closed'

export type TimelineType =
  | 'founded'
  | 'funding'
  | 'model'
  | 'product'
  | 'research'
  | 'milestone'
  | 'news'
  | 'leadership'

export type NewsSourceType = 'rss' | 'blog' | 'github' | 'huggingface' | 'manual'

export type ProductKind = 'consumer' | 'enterprise'

export interface Coordinates {
  lng: number
  lat: number
}

export interface Product {
  id: string
  name: string
  description: string
  url?: string
  kind: ProductKind
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  type: TimelineType
  companyId?: string
  modelId?: string
  newsId?: string
  fundingId?: string
  url?: string
}

export interface Capabilities {
  reasoning: CapabilityScore
  coding: CapabilityScore
  vision: CapabilityScore
  audio: CapabilityScore
  video: CapabilityScore
  imageGeneration: CapabilityScore
  longContext: CapabilityScore
  agentSupport: CapabilityScore
}

export interface Company {
  id: string
  name: string
  slug: string
  legalName?: string
  logo: string
  description: string
  longDescription: string
  headquarters: string
  city: string
  countryId: string
  regionId: RegionId
  coordinates: Coordinates
  founderIds: string[]
  ceoId: string | null
  founded: string
  employees: number | null
  employeesAsOf?: string
  totalFundingUsd: number | null
  valuationUsd: number | null
  valuationAsOf?: string
  revenueUsd: number | null
  revenueAsOf?: string
  investors: string[]
  website: string
  blogUrl?: string
  rssUrl?: string
  githubOrg?: string
  huggingFaceOrg?: string
  consumerProducts: Product[]
  enterpriseProducts: Product[]
  researchAreaIds: string[]
  latestModelId: string | null
  latestNewsId: string | null
  timeline: TimelineEvent[]
  tags: string[]
  openSource: boolean
  closedSource: boolean
  consumer: boolean
  enterprise: boolean
  color: string
  status: 'operating' | 'stealth' | 'acquired'
}

export interface Model {
  id: string
  name: string
  slug: string
  companyId: string
  releaseDate: string
  family: string
  previousModelId: string | null
  description: string
  capabilities: Capabilities
  contextWindow: number | null
  openClosed: OpenClosed
  apiAvailable: boolean
  whatsNew: string
  benchmarkScoreIds: string[]
  announcementUrl?: string
  paperUrl?: string
  huggingFaceUrl?: string
  githubUrl?: string
}

export interface PreviousCompany {
  name: string
  role: string
  years?: string
}

export interface Founder {
  id: string
  name: string
  slug: string
  photo: string
  title?: string
  biography: string
  companyIds: string[]
  previousCompanies: PreviousCompany[]
  researchContributions: string[]
  timeline: TimelineEvent[]
  countryId?: string
  website?: string
  wikipedia?: string
}

export interface Country {
  id: string
  name: string
  iso3: string
  regionId: RegionId
  coordinates: Coordinates
  description: string
  activityScore: number
  companyCount: number
  modelCount: number
  enabled: boolean
}

export interface Region {
  id: RegionId
  name: string
  countryIds: string[]
  center: Coordinates
  zoom: number
  description: string
  enabled: boolean
}

export interface NewsItem {
  id: string
  title: string
  date: string
  summary: string
  url: string
  source: string
  companyIds: string[]
  modelIds: string[]
  sourceType: NewsSourceType
  generated: boolean
}

export interface FundingRound {
  id: string
  companyId: string
  date: string
  round: string
  amountUsd: number | null
  valuationUsd: number | null
  investors: string[]
  leadInvestors: string[]
  notes?: string
}

export interface Benchmark {
  id: string
  name: string
  category: string
  description: string
}

export interface BenchmarkScore {
  id: string
  benchmarkId: string
  modelId: string
  score: number
  unit: 'percent' | 'raw' | 'elo'
  date: string
  notes?: string
}

export interface ResearchArea {
  id: string
  name: string
  description: string
}

export interface ResearchLab {
  id: string
  name: string
  companyId: string | null
  countryId: string
  city?: string
  description: string
  focusAreaIds: string[]
  url?: string
}

export interface CompanyIndexItem {
  id: string
  name: string
  slug: string
  logo: string
  countryId: string
  regionId: RegionId
  coordinates: Coordinates
  tags: string[]
  latestModelId: string | null
  color: string
  openSource: boolean
  closedSource: boolean
  consumer: boolean
  enterprise: boolean
  valuationUsd: number | null
  totalFundingUsd: number | null
  employees: number | null
  founded: string
  status: Company['status']
}

export interface ModelIndexItem {
  id: string
  name: string
  slug: string
  companyId: string
  family: string
  releaseDate: string
  openClosed: OpenClosed
  capabilities: Capabilities
  apiAvailable: boolean
}

export interface FounderIndexItem {
  id: string
  name: string
  slug: string
  photo: string
  companyIds: string[]
  title?: string
}

export interface NewsIndexItem {
  id: string
  title: string
  date: string
  source: string
  companyIds: string[]
  generated: boolean
}

export interface DataIndex {
  generatedAt: string
  companies: CompanyIndexItem[]
  models: ModelIndexItem[]
  founders: FounderIndexItem[]
  countries: Country[]
  regions: Region[]
  news: NewsIndexItem[]
  funding: FundingRound[]
  benchmarks: Benchmark[]
  benchmarkScores: BenchmarkScore[]
  researchAreas: ResearchArea[]
  researchLabs: ResearchLab[]
}

export interface SearchHit {
  type: 'company' | 'model' | 'founder' | 'country' | 'product' | 'news'
  id: string
  slug?: string
  title: string
  subtitle: string
  href: string
}

export interface FilterState {
  regionId: RegionId | null
  countryId: string | null
  companyId: string | null
  modelFamily: string | null
  capabilities: CapabilityName[]
  openSource: boolean | null
  closedSource: boolean | null
  consumer: boolean | null
  enterprise: boolean | null
  query: string
}
