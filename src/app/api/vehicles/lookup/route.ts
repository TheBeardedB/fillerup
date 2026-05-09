import { NextRequest, NextResponse } from 'next/server'

interface LookupResult {
  vehicleType: string | null
  engineType: string | null
  tireSize: string | null
  oilType: string | null
  oilFilterHint: string | null
  trimLevel: string | null
}

interface TrimCandidate extends LookupResult {
  id: string
  label: string
  source: 'carquery' | 'fueleconomy'
}

interface CarQueryTrim {
  model_id: string | null
  model_trim: string | null
  model_body: string | null
  model_engine_cc: string | null
  model_engine_cyl: string | null
  model_engine_type: string | null
  model_tires_front: string | null
  model_engine_fuel: string | null
}

function formatEngineType(trim: CarQueryTrim): string | null {
  const cc = Number(trim.model_engine_cc)
  const cyl = trim.model_engine_cyl
  const type = trim.model_engine_type
  if (!cc || !cyl) return null
  const liters = (cc / 1000).toFixed(1)
  const config = type === 'L' ? `Inline-${cyl}` : type === 'F' ? `Flat-${cyl}` : type ? `${type}${cyl}` : `${cyl}-cyl`
  return `${liters}L ${config}`
}

function inferOilType(trim: CarQueryTrim): string | null {
  const cc = Number(trim.model_engine_cc)
  const fuel = trim.model_engine_fuel?.toLowerCase() ?? ''
  if (!cc) return null
  if (fuel.includes('diesel')) return '5W-40'
  if (cc < 2000) return '0W-20'
  if (cc < 3000) return '5W-20'
  return '5W-30'
}

function normalizeBody(body: string | null): string | null {
  if (!body) return null
  const b = body.toLowerCase()
  if (b.includes('pickup') || b.includes('truck')) return 'Truck'
  if (b.includes('suv') || b.includes('sport utility')) return 'SUV'
  if (b.includes('sedan') || b.includes('saloon')) return 'Sedan'
  if (b.includes('coupe') || b.includes('coup')) return 'Coupe'
  if (b.includes('hatch')) return 'Hatchback'
  if (b.includes('wagon') || b.includes('estate')) return 'Wagon'
  if (b.includes('van') || b.includes('minivan')) return 'Van'
  if (b.includes('convert')) return 'Convertible'
  return body.charAt(0).toUpperCase() + body.slice(1)
}

function fallbackErrorDetails(err: any) {
  return {
    message: err?.message ?? 'unknown error',
    name: err?.name,
    code: err?.code,
    cause: err?.cause ? {
      message: err.cause?.message,
      name: err.cause?.name,
      code: err.cause?.code,
      errno: err.cause?.errno,
      syscall: err.cause?.syscall,
      hostname: err.cause?.hostname,
    } : null,
  }
}

async function lookupWithCarQuery(year: string, make: string, model: string, logPrefix: string): Promise<TrimCandidate[]> {
  const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&callback=data`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; fuel-log/1.0)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    const bodySnippet = (await res.text()).slice(0, 400)
    console.error(`${logPrefix} carquery non-200`, { status: res.status, bodySnippet })
    throw new Error(`CarQuery returned ${res.status}`)
  }

  const text = await res.text()
  const json = text.replace(/^data\s*\(/, '').replace(/\);\s*$/, '').trim()
  const parsed = JSON.parse(json) as { Trims?: CarQueryTrim[] }
  const trims = (parsed.Trims ?? []).filter(t => (t.model_trim ?? '').trim() !== '')

  return trims.map((t, i) => ({
    id: t.model_id || `carquery-${i}`,
    label: t.model_trim || `Trim ${i + 1}`,
    source: 'carquery',
    trimLevel: t.model_trim || null,
    vehicleType: normalizeBody(t.model_body),
    engineType: formatEngineType(t),
    tireSize: t.model_tires_front || null,
    oilType: inferOilType(t),
    oilFilterHint: null,
  }))
}

async function lookupWithFuelEconomy(year: string, make: string, model: string, logPrefix: string): Promise<TrimCandidate[]> {
  const url = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) {
    console.error(`${logPrefix} fueleconomy non-200`, { status: res.status })
    return []
  }
  const xml = await res.text()
  const menuItems = Array.from(xml.matchAll(/<menuItem>([\s\S]*?)<\/menuItem>/g), m => m[1])
  const candidates: TrimCandidate[] = []
  for (let i = 0; i < menuItems.length; i++) {
    const chunk = menuItems[i]
    const label = chunk.match(/<text>([\s\S]*?)<\/text>/)?.[1]?.trim() ?? ''
    const id = chunk.match(/<value>([\s\S]*?)<\/value>/)?.[1]?.trim() ?? `fueleconomy-${i}`
    if (!label) continue
    candidates.push({
      id,
      label,
      source: 'fueleconomy',
      trimLevel: label,
      vehicleType: null,
      engineType: null,
      tireSize: null,
      oilType: null,
      oilFilterHint: null,
    })
  }
  return candidates
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')?.trim()
  const make = searchParams.get('make')?.trim()
  const model = searchParams.get('model')?.trim()
  const selectedTrimId = searchParams.get('trimId')?.trim() ?? null
  const logPrefix = '[vehicle-lookup]'

  if (!year || !make || !model) {
    console.warn(`${logPrefix} missing params`, { year: !!year, make: !!make, model: !!model })
    return NextResponse.json({ error: 'year, make, and model are required' }, { status: 400 })
  }

  console.info(`${logPrefix} start`, { year, make, model, selectedTrimId })

  let candidates: TrimCandidate[] = []
  try {
    candidates = await lookupWithCarQuery(year, make, model, logPrefix)
    console.info(`${logPrefix} carquery candidates`, { count: candidates.length })
  } catch (err: any) {
    console.error(`${logPrefix} carquery failed`, fallbackErrorDetails(err))
  }

  if (candidates.length === 0) {
    try {
      candidates = await lookupWithFuelEconomy(year, make, model, logPrefix)
      console.info(`${logPrefix} fueleconomy fallback candidates`, { count: candidates.length })
    } catch (err: any) {
      console.error(`${logPrefix} fueleconomy failed`, fallbackErrorDetails(err))
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      result: {
        vehicleType: null, engineType: null, tireSize: null, oilType: null, oilFilterHint: null, trimLevel: null,
      },
      candidates: [],
      needsSelection: false,
      source: 'none',
      note: 'No lookup data found. You can still enter specs manually.',
    })
  }

  const selected = selectedTrimId
    ? candidates.find(c => c.id === selectedTrimId) ?? candidates[0]
    : candidates.length === 1
      ? candidates[0]
      : null

  if (!selected) {
    return NextResponse.json({
      result: null,
      candidates,
      needsSelection: true,
      source: candidates[0].source,
      note: 'Multiple trims found. Please pick one.',
    })
  }

  return NextResponse.json({
    result: {
      vehicleType: selected.vehicleType,
      engineType: selected.engineType,
      tireSize: selected.tireSize,
      oilType: selected.oilType,
      oilFilterHint: selected.oilFilterHint,
      trimLevel: selected.trimLevel,
    },
    candidates,
    needsSelection: false,
    source: selected.source,
    note: selected.source === 'fueleconomy'
      ? 'Fallback source only returned trim names. Tire/oil/filter details may need manual entry.'
      : null,
  })
}
