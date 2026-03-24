import { NextRequest, NextResponse } from 'next/server'

interface CarQueryTrim {
  model_body:          string | null
  model_engine_cc:     string | null
  model_engine_cyl:    string | null
  model_engine_type:   string | null
  model_tires_front:   string | null
  model_engine_fuel:   string | null
}

interface LookupResult {
  vehicleType: string | null
  engineType:  string | null
  tireSize:    string | null
  oilType:     string | null
}

function formatEngineType(trim: CarQueryTrim): string | null {
  const cc   = Number(trim.model_engine_cc)
  const cyl  = trim.model_engine_cyl
  const type = trim.model_engine_type  // "V", "L" (inline), "F" (flat), "W", etc.
  if (!cc || !cyl) return null

  const liters = (cc / 1000).toFixed(1)
  const config = type === 'L' ? `Inline-${cyl}`
               : type === 'F' ? `Flat-${cyl}`
               : type         ? `${type}${cyl}`
               : `${cyl}-cyl`
  return `${liters}L ${config}`
}

// Best-effort oil type from engine displacement + fuel type
// Common US recommendations — very approximate, user should verify
function inferOilType(trim: CarQueryTrim): string | null {
  const cc   = Number(trim.model_engine_cc)
  const fuel = trim.model_engine_fuel?.toLowerCase() ?? ''
  if (!cc) return null
  if (fuel.includes('diesel')) return '5W-40'
  // Most modern gasoline engines: 0W-20 (small), 5W-20/5W-30 (mid), 5W-30 (larger)
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
  // Capitalize first letter as fallback
  return body.charAt(0).toUpperCase() + body.slice(1)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year  = searchParams.get('year')?.trim()
  const make  = searchParams.get('make')?.trim()
  const model = searchParams.get('model')?.trim()

  if (!year || !make || !model) {
    return NextResponse.json({ error: 'year, make, and model are required' }, { status: 400 })
  }

  try {
    // CarQuery API returns JSONP: data({...}) — strip the wrapper
    const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&callback=data`
    const res  = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; fuel-log/1.0)' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`CarQuery returned ${res.status}`)

    const text   = await res.text()
    // Strip JSONP wrapper: data({...});
    const json   = text.replace(/^data\s*\(/, '').replace(/\);\s*$/, '').trim()
    const parsed = JSON.parse(json) as { Trims?: CarQueryTrim[] }
    const trims  = parsed.Trims ?? []

    if (trims.length === 0) {
      return NextResponse.json<LookupResult>({
        vehicleType: null, engineType: null, tireSize: null, oilType: null,
      })
    }

    // Pick trim with the most data (prefer ones that have tire info)
    const best = trims.find(t => t.model_tires_front) ?? trims[0]

    const result: LookupResult = {
      vehicleType: normalizeBody(best.model_body),
      engineType:  formatEngineType(best),
      tireSize:    best.model_tires_front || null,
      oilType:     inferOilType(best),
    }

    return NextResponse.json(result)
  } catch (err: any) {
    // Return empty result rather than erroring — user can fill manually
    return NextResponse.json<LookupResult>({
      vehicleType: null, engineType: null, tireSize: null, oilType: null,
    })
  }
}
