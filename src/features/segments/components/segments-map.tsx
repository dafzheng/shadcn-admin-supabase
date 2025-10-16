import { useEffect, useMemo, useRef, useState } from 'react'
import {
  json,
  geoNaturalEarth1,
  geoPath,
  max,
  scaleSqrt,
  select,
  zoom,
  zoomIdentity,
  type ZoomBehavior,
  type ZoomTransform,
} from 'd3'
import type { FeatureCollection, Geometry } from 'geojson'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useSegments } from './segments-provider'

type AggregatedLocation = {
  id: string
  label: string
  total: number
  segments: Array<{
    id: string
    name: string
    total: number
  }>
}

type GeocodeEntry = {
  lat: number
  lng: number
} | null

type MapPoint = AggregatedLocation & {
  coordinates: [number, number]
}

type TooltipState = {
  x: number
  y: number
  location: string
  total: number
  segments: AggregatedLocation['segments']
}

const WORLD_GEOJSON_URL =
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
const GEOCODE_CACHE_KEY = 'segments-map-geocodes-v1'
const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json'
const MAP_WIDTH = 960
const MAP_HEIGHT = 520
const SPIKE_MAX_HEIGHT = 90

const loadCachedGeocodes = (): Record<string, GeocodeEntry> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(GEOCODE_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, GeocodeEntry>
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse geocode cache, clearing it.', error)
    }
    window.localStorage.removeItem(GEOCODE_CACHE_KEY)
    return {}
  }
}

const persistCachedGeocodes = (cache: Record<string, GeocodeEntry>) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist geocode cache.', error)
    }
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const useGeocodedLocations = (locations: AggregatedLocation[]) => {
  const [geocodes, setGeocodes] = useState<Record<string, GeocodeEntry>>(loadCachedGeocodes)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const geocodeRef = useRef(geocodes)
  useEffect(() => {
    geocodeRef.current = geocodes
  }, [geocodes])

  const apiKey =
    import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY ?? import.meta.env.GOOGLE_GEOCODING_API_KEY

  const locationKeys = useMemo(
    () => Array.from(new Set(locations.map((location) => location.id))).sort(),
    [locations]
  )

  useEffect(() => {
    if (!locationKeys.length) {
      setStatus('idle')
      setError(null)
      return
    }

    const cached = geocodeRef.current
    const missing = locationKeys.filter(
      (key) => !Object.prototype.hasOwnProperty.call(cached, key)
    )

    if (!missing.length) {
      setStatus('ready')
      setError(null)
      return
    }

    if (!apiKey) {
      setStatus('error')
      setError('Google Geocoding API key is missing. Please set VITE_GOOGLE_GEOCODING_API_KEY.')
      return
    }

    let ignore = false

    const fetchGeocodes = async () => {
      setStatus('loading')
      const nextCache: Record<string, GeocodeEntry> = { ...geocodeRef.current }

      try {
        for (const key of missing) {
          const response = await fetch(
            `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(key)}&key=${apiKey}`
          )

          if (!response.ok) {
            throw new Error(`Failed to geocode "${key}" (${response.status})`)
          }

          const data = await response.json()

          if (data.status === 'OK' && data.results?.length) {
            const { lat, lng } = data.results[0].geometry.location
            nextCache[key] = { lat, lng }
          } else {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.warn('Geocoding returned no results for location:', key, data.status)
            }
            nextCache[key] = null
          }

          // Be a little gentle with the Google API.
          await delay(150)
        }

        if (ignore) return

        setGeocodes(nextCache)
        persistCachedGeocodes(nextCache)
        setStatus('ready')
        setError(null)
      } catch (err) {
        if (ignore) return
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Failed to geocode locations', err)
        }
        setError(err instanceof Error ? err.message : 'Failed to geocode locations')
        setStatus('error')
      }
    }

    fetchGeocodes()

    return () => {
      ignore = true
    }
  }, [apiKey, locationKeys])

  return {
    geocodes,
    status,
    error,
  }
}

const useWorldMap = () => {
  const [world, setWorld] = useState<FeatureCollection<Geometry> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const loadWorld = async () => {
      try {
        const countries = (await json(WORLD_GEOJSON_URL)) as FeatureCollection<Geometry>

        if (!ignore) {
          setWorld(countries)
          setError(null)
        }
      } catch (err) {
        if (!ignore) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error('Failed to load world map', err)
          }
          setError(err instanceof Error ? err.message : 'Failed to load world map')
        }
      }
    }

    loadWorld()

    return () => {
      ignore = true
    }
  }, [])

  return { world, error }
}

export function SegmentsMap() {
  const { segmentList } = useSegments()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const lastTransformRef = useRef<ZoomTransform | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const aggregatedLocations = useMemo<AggregatedLocation[]>(() => {
    const locationMap = new Map<string, AggregatedLocation>()

    segmentList.forEach((segment) => {
      if (!segment.personLocations?.length) {
        return
      }

      const total = segment.queriedTotalEntries ?? -1
      if (total < 0) {
        return
      }

      segment.personLocations.forEach((location) => {
        if (!location?.value && !location?.label) return
        const key = location.value || location.label

        if (!key) return

        const existing = locationMap.get(key)
        const entry = existing ?? {
          id: key,
          label: location.label ?? key,
          total: 0,
          segments: [],
        }

        entry.total += total
        entry.segments.push({
          id: segment.id,
          name: segment.segmentName,
          total,
        })

        locationMap.set(key, entry)
      })
    })

    return Array.from(locationMap.values()).sort((a, b) => b.total - a.total)
  }, [segmentList])

  const { geocodes, status: geocodeStatus, error: geocodeError } =
    useGeocodedLocations(aggregatedLocations)

  const mapPoints = useMemo<MapPoint[]>(() => {
    return aggregatedLocations.flatMap((location) => {
      const geocode = geocodes[location.id]
      if (!geocode || !geocode.lat || !geocode.lng) {
        return []
      }

      return [
        {
          ...location,
          coordinates: [geocode.lng, geocode.lat] as [number, number],
        },
      ]
    })
  }, [aggregatedLocations, geocodes])

  const { world, error: worldError } = useWorldMap()

  useEffect(() => {
    if (!svgRef.current || !world) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    svg
      .attr('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'img')
      .attr('aria-label', 'Segments location world map')
      .style('cursor', 'grab')
      .style('touch-action', 'none')

    const projection = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], world)
    const path = geoPath(projection)

    const rootStyles =
      typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement)
        : (null as CSSStyleDeclaration | null)

    const landFill = rootStyles?.getPropertyValue('--muted')?.trim() || '#e2e8f0'
    const landStroke = rootStyles?.getPropertyValue('--border')?.trim() || '#cbd5f5'
    const spikeColor = rootStyles?.getPropertyValue('--primary')?.trim() || '#2563eb'
    const spikeBase = rootStyles?.getPropertyValue('--primary-foreground')?.trim() || '#93c5fd'

    const mapRoot = svg.append('g').attr('data-map-root', 'true')

    mapRoot
      .append('g')
      .selectAll('path')
      .data(world.features)
      .join('path')
      .attr('d', path)
      .attr('fill', landFill)
      .attr('stroke', landStroke)
      .attr('stroke-width', 0.6)

    if (!mapPoints.length) {
      setTooltip(null)
      return
    }

    const maxValue = max(mapPoints, (d) => d.total) ?? 0
    const heightScale = scaleSqrt()
      .domain([0, maxValue])
      .range([0, SPIKE_MAX_HEIGHT])

    const spikesGroup = mapRoot
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', spikeColor)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('vector-effect', 'non-scaling-stroke')

    const spikes = spikesGroup
      .selectAll<SVGLineElement, MapPoint>('line')
      .data(mapPoints, (d) => d.id)
      .join('line')
      .attr('x1', (d) => {
        const point = projection(d.coordinates)
        return point ? point[0] : 0
      })
      .attr('y1', (d) => {
        const point = projection(d.coordinates)
        return point ? point[1] : 0
      })
      .attr('x2', (d) => {
        const point = projection(d.coordinates)
        if (!point) return 0
        return point[0]
      })
      .attr('y2', (d) => {
        const point = projection(d.coordinates)
        if (!point) return 0
        return point[1] - heightScale(d.total)
      })
      .attr('vector-effect', 'non-scaling-stroke')

    const showTooltip = (event: PointerEvent, datum: MapPoint) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const offsetX = 12
      const offsetY = 12
      const rawX = event.clientX - rect.left + offsetX
      const rawY = event.clientY - rect.top - offsetY
      const constrainedX = Math.min(Math.max(rawX, 8), rect.width - 8)
      const constrainedY = Math.min(Math.max(rawY, 8), rect.height - 8)

      setTooltip({
        x: constrainedX,
        y: constrainedY,
        location: datum.label,
        total: datum.total,
        segments: datum.segments,
      })
    }

    const hideTooltip = () => {
      setTooltip(null)
    }

    spikes
      .style('pointer-events', 'stroke')
      .on('pointerenter', function (event, datum) {
        showTooltip(event as PointerEvent, datum)
      })
      .on('pointermove', function (event, datum) {
        showTooltip(event as PointerEvent, datum)
      })
      .on('pointerleave', hideTooltip)

    const markersGroup = mapRoot
      .append('g')
      .attr('fill', spikeBase)
      .attr('stroke', spikeColor)
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.9)

    const markers = markersGroup
      .selectAll<SVGCircleElement, MapPoint>('circle')
      .data(mapPoints, (d) => d.id)
      .join('circle')
      .attr('cx', (d) => {
        const point = projection(d.coordinates)
        return point ? point[0] : 0
      })
      .attr('cy', (d) => {
        const point = projection(d.coordinates)
        return point ? point[1] : 0
      })
      .attr('r', 3.5)

    markers
      .on('pointerenter', function (event, datum) {
        showTooltip(event as PointerEvent, datum)
      })
      .on('pointermove', function (event, datum) {
        showTooltip(event as PointerEvent, datum)
      })
      .on('pointerleave', hideTooltip)
    const initialTransform = lastTransformRef.current ?? zoomIdentity
    mapRoot.attr('transform', initialTransform.toString())

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [MAP_WIDTH, MAP_HEIGHT],
      ])
      .on('start', () => {
        svg.style('cursor', 'grabbing')
      })
      .on('end', () => {
        svg.style('cursor', 'grab')
      })
      .on('zoom', (event) => {
        lastTransformRef.current = event.transform
        mapRoot.attr('transform', event.transform.toString())
      })

    svg.call(zoomBehavior).call(zoomBehavior.transform, initialTransform).on('dblclick.zoom', null)

    zoomBehaviorRef.current = zoomBehavior
  }, [world, mapPoints])

  const shouldShowOverlay = geocodeStatus === 'loading'

  const legendData = useMemo(() => {
    if (!mapPoints.length) return null
    const maxValue = max(mapPoints, (d) => d.total) ?? 0
    if (maxValue <= 0) return null
    return { maxValue }
  }, [mapPoints])

  const formatTotal = (value: number) => {
    return new Intl.NumberFormat(undefined, {
      notation: value >= 1000 ? 'compact' : 'standard',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const applyZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    const svg = select(svgRef.current)
    svg
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, scaleFactor)
  }

  const handleZoomIn = () => applyZoom(1.5)
  const handleZoomOut = () => applyZoom(1 / 1.5)

  return (
    <Card>
      <CardHeader className='pb-0'>
        <CardTitle>Segments by Location</CardTitle>
        <CardDescription>
          Aggregated people counts by segment location.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {(geocodeError || worldError) && (
          <div className='text-destructive text-sm'>
            {geocodeError ?? worldError ?? 'Unable to load map.'}
          </div>
        )}
        <div className='relative overflow-hidden rounded-lg border'>
          <svg ref={svgRef} className='h-auto w-full' />
          <div className='absolute right-3 top-3 flex flex-col gap-2'>
            <button
              type='button'
              onClick={handleZoomIn}
              className='flex h-9 w-9 items-center justify-center rounded-md border bg-background/80 text-lg font-semibold shadow-sm backdrop-blur-sm transition hover:bg-muted'
              aria-label='Zoom in'
            >
              +
            </button>
            <button
              type='button'
              onClick={handleZoomOut}
              className='flex h-9 w-9 items-center justify-center rounded-md border bg-background/80 text-lg font-semibold shadow-sm backdrop-blur-sm transition hover:bg-muted'
              aria-label='Zoom out'
            >
              -
            </button>
          </div>
          {tooltip && (
            <div
              className='pointer-events-none absolute z-10 max-w-xs -translate-x-1/2 -translate-y-3 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-lg ring-1 ring-border/40 backdrop-blur'
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
              }}
            >
              <div className='text-sm font-semibold text-foreground'>{tooltip.location}</div>
              <div className='text-muted-foreground'>
                {tooltip.total.toLocaleString()} total entries
              </div>
              <div className='mt-1 space-y-0.5 text-muted-foreground'>
                {tooltip.segments.slice(0, 3).map((segment) => (
                  <div key={segment.id} className='flex items-center gap-2'>
                    <span className='inline-flex h-1.5 w-1.5 flex-none rounded-full bg-primary/70' />
                    <span className='truncate'>{segment.name}</span>
                    <span className='flex-none text-[11px] text-muted-foreground/80'>
                      {formatTotal(segment.total)}
                    </span>
                  </div>
                ))}
                {tooltip.segments.length > 3 && (
                  <div className='pt-0.5 text-[11px] text-muted-foreground/80'>
                    +{tooltip.segments.length - 3} more segment
                    {tooltip.segments.length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
          {shouldShowOverlay && (
            <div className='absolute inset-0 flex items-center justify-center gap-2 bg-background/60 backdrop-blur-sm'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='text-sm'>Geocoding locations…</span>
            </div>
          )}
          {!shouldShowOverlay && !mapPoints.length && !geocodeError && (
            <div className='absolute inset-0 flex items-center justify-center text-sm text-muted-foreground'>
              No locations with query results found.
            </div>
          )}
        </div>
        {mapPoints.length > 0 && (
          <p className='text-muted-foreground text-xs'>
            Showing {mapPoints.length} locations derived from segment filters. Spike height is
            proportional to the queried total entries per location.
          </p>
        )}
        {legendData && (
          <div className='flex flex-wrap items-start gap-4 rounded-md border bg-muted/40 p-4 text-xs'>
            <div className='flex max-w-[220px] flex-col gap-1 text-muted-foreground'>
              <span className='text-sm font-medium text-foreground'>Legend</span>
              <span>Each spike aggregates queried people per location. Higher spikes indicate more entries.</span>
            </div>
            <div className='flex flex-col gap-2 text-primary'>
              <div className='flex items-end gap-3'>
                <div className='flex flex-col items-center gap-1'>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    High
                  </span>
                  <span className='inline-flex h-16 w-0.5 rotate-180 justify-end'>
                    <span className='block h-[40px] w-0.5 rounded-full bg-current' />
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {formatTotal(legendData.maxValue)}
                  </span>
                </div>
                <div className='flex flex-col items-center gap-1 text-primary'>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Medium
                  </span>
                  <span className='inline-flex h-16 w-0.5 rotate-180 justify-end'>
                    <span className='block h-[24px] w-0.5 rounded-full bg-current' />
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {formatTotal(legendData.maxValue / 2)}
                  </span>
                </div>
                <div className='flex flex-col items-center gap-1 text-primary'>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Low
                  </span>
                  <span className='inline-flex h-16 w-0.5 rotate-180 justify-end'>
                    <span className='block h-[12px] w-0.5 rounded-full bg-current' />
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {formatTotal(Math.max(legendData.maxValue / 4, 1))}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex flex-none flex-col gap-1 text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <span className='inline-block h-3 w-3 rounded-full border border-primary/40 bg-primary/20' />
                <span>Location marker</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='inline-block h-3 w-6 rounded bg-muted' />
                <span>Basemap fills</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
