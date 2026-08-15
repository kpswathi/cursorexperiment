import { useEffect, useMemo, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { CompanyIndexItem, Country, Region } from '@/types'
import { MAP_STYLE } from '@/lib/constants'

interface WorldMapProps {
  companies: CompanyIndexItem[]
  countries: Country[]
  regions: Region[]
  selectedId: string | null
  onSelectCompany: (id: string) => void
  onSelectCountry: (id: string) => void
  focusRegionId: string | null
}

export function WorldMap({
  companies,
  countries,
  selectedId,
  onSelectCompany,
  onSelectCountry,
  focusRegionId,
  regions,
}: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const onSelectCompanyRef = useRef(onSelectCompany)
  const onSelectCountryRef = useRef(onSelectCountry)
  onSelectCompanyRef.current = onSelectCompany
  onSelectCountryRef.current = onSelectCountry

  const companyData = useMemo(() => companiesToGeoJSON(companies), [companies])
  const scoreByIso = useMemo(() => {
    const map: Record<string, number> = {}
    for (const country of countries) map[country.id] = country.activityScore
    return map
  }, [countries])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [12, 22],
      zoom: 1.55,
      minZoom: 1.1,
      maxZoom: 8,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map
    popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 12 })

    map.on('load', () => {
      map.addSource('countries', {
        type: 'geojson',
        data: `${import.meta.env.BASE_URL}geo/countries.geojson`,
      })
      map.addLayer({
        id: 'country-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': '#1b2430',
          'fill-opacity': 0.78,
        },
      }, findFirstSymbol(map))
      map.addLayer({
        id: 'country-line',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': '#3a4658',
          'line-width': 0.6,
        },
      })

      map.addSource('companies', {
        type: 'geojson',
        data: companyData,
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 46,
      })
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'companies',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#3ee0c2',
          'circle-radius': ['step', ['get', 'point_count'], 16, 4, 20, 8, 26],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#07090d',
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'companies',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['to-string', ['get', 'point_count']],
          'text-size': 12,
        },
        paint: { 'text-color': '#07090d' },
      })
      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: 'companies',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#07090d',
        },
      })

      applyCountryColors(map, scoreByIso)

      map.on('click', 'clusters', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id as number
        const source = map.getSource('companies') as GeoJSONSource
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geometry = feature.geometry as { type: 'Point'; coordinates: number[] }
          map.easeTo({ center: geometry.coordinates as [number, number], zoom })
        })
      })

      map.on('click', 'unclustered', (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id as string | undefined
        if (id) onSelectCompanyRef.current(id)
      })

      map.on('click', 'country-fill', (event: MapLayerMouseEvent) => {
        if (event.features?.length && map.queryRenderedFeatures(event.point, { layers: ['unclustered', 'clusters'] }).length) {
          return
        }
        const iso = event.features?.[0]?.properties?.iso_a2 as string | undefined
        if (iso && iso !== '-99') onSelectCountryRef.current(iso)
      })

      map.on('mouseenter', 'unclustered', (event: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer'
        const feature = event.features?.[0]
        if (!feature || !popupRef.current) return
        const geometry = feature.geometry as { type: 'Point'; coordinates: number[] }
        const coords = geometry.coordinates.slice() as [number, number]
        popupRef.current
          .setLngLat(coords)
          .setHTML(
            `<div style="font-size:12px"><strong>${feature.properties?.name}</strong><div style="opacity:.7">${feature.properties?.city ?? ''}</div></div>`,
          )
          .addTo(map)
      })
      map.on('mouseleave', 'unclustered', () => {
        map.getCanvas().style.cursor = ''
        popupRef.current?.remove()
      })
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
    // Map is created once; subsequent updates go through the other effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getSource('companies')) return
    ;(map.getSource('companies') as GeoJSONSource).setData(companyData)
  }, [companyData])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.getLayer('country-fill')) return
    applyCountryColors(map, scoreByIso)
  }, [scoreByIso])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusRegionId) return
    const region = regions.find((item) => item.id === focusRegionId)
    if (!region) return
    map.easeTo({ center: [region.center.lng, region.center.lat], zoom: region.zoom, duration: 800 })
  }, [focusRegionId, regions])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const company = companies.find((item) => item.id === selectedId)
    if (!company) return
    map.easeTo({
      center: [company.coordinates.lng, company.coordinates.lat],
      zoom: Math.max(map.getZoom(), 4.6),
      duration: 700,
    })
  }, [selectedId, companies])

  return <div ref={containerRef} className="h-full w-full" />
}

function companiesToGeoJSON(companies: CompanyIndexItem[]): {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: Record<string, string>
    geometry: { type: 'Point'; coordinates: [number, number] }
  }>
} {
  return {
    type: 'FeatureCollection',
    features: companies.map((company) => ({
      type: 'Feature',
      properties: {
        id: company.id,
        name: company.name,
        color: company.color,
        city: company.countryId,
      },
      geometry: {
        type: 'Point',
        coordinates: [company.coordinates.lng, company.coordinates.lat],
      },
    })),
  }
}

function applyCountryColors(map: MapLibreMap, scoreByIso: Record<string, number>) {
  const expr = [
    'match',
    ['get', 'iso_a2'],
    ...Object.entries(scoreByIso).flatMap(([iso, score]) => [iso, activityColor(score)]),
    '#151b24',
  ] as unknown as ExpressionSpecification
  map.setPaintProperty('country-fill', 'fill-color', expr)
}

function activityColor(score: number) {
  if (score <= 0) return '#151b24'
  if (score < 20) return '#1c3340'
  if (score < 40) return '#1f4d52'
  if (score < 70) return '#1f6b62'
  return '#1f8f78'
}

function findFirstSymbol(map: MapLibreMap) {
  const layers = map.getStyle().layers ?? []
  const symbol = layers.find((layer) => layer.type === 'symbol')
  return symbol?.id
}
