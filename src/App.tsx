import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DataProvider } from '@/context/DataProvider'
import { FilterProvider } from '@/context/FilterProvider'
import { CompareProvider } from '@/context/CompareProvider'
import { AppShell } from '@/components/layout/AppShell'

const MapExplorer = lazy(() => import('@/pages/MapExplorer'))
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage'))
const CompanyDetailPage = lazy(() => import('@/pages/CompanyDetailPage'))
const ModelsPage = lazy(() => import('@/pages/ModelsPage'))
const ModelDetailPage = lazy(() => import('@/pages/ModelDetailPage'))
const FoundersPage = lazy(() => import('@/pages/FoundersPage'))
const FounderDetailPage = lazy(() => import('@/pages/FounderDetailPage'))
const ComparePage = lazy(() => import('@/pages/ComparePage'))
const TimelinePage = lazy(() => import('@/pages/TimelinePage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))
const ResearchPage = lazy(() => import('@/pages/ResearchPage'))
const CountryPage = lazy(() => import('@/pages/CountryPage'))

function Fallback() {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-mist">
      Loading view…
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <CompareProvider>
          <FilterProvider>
            <Suspense fallback={<Fallback />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<MapExplorer />} />
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="companies/:slug" element={<CompanyDetailPage />} />
                  <Route path="models" element={<ModelsPage />} />
                  <Route path="models/:slug" element={<ModelDetailPage />} />
                  <Route path="founders" element={<FoundersPage />} />
                  <Route path="founders/:slug" element={<FounderDetailPage />} />
                  <Route path="compare" element={<ComparePage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="news" element={<NewsPage />} />
                  <Route path="research" element={<ResearchPage />} />
                  <Route path="countries/:id" element={<CountryPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </FilterProvider>
        </CompareProvider>
      </DataProvider>
    </HashRouter>
  )
}
