import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { fillups, maintenance, vehicles } from '@/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { getOrCreateCurrentUser } from '@/lib/current-user'

function csvEscape(value: unknown) {
  if (value == null) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv<T extends Record<string, unknown>>(rows: T[]) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(row[h])).join(','))
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getOrCreateCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vehicleId = Number(params.id)
  if (Number.isNaN(vehicleId)) return NextResponse.json({ error: 'Invalid vehicle id' }, { status: 400 })

  const [vehicle] = await db
    .select({ id: vehicles.id, name: vehicles.name })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, user.id)))
    .limit(1)

  if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })

  const format = (req.nextUrl.searchParams.get('format') ?? 'json').toLowerCase()
  const dataset = (req.nextUrl.searchParams.get('dataset') ?? 'fillups').toLowerCase()
  if (!['json', 'csv'].includes(format)) return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  if (!['fillups', 'maintenance', 'all'].includes(dataset)) return NextResponse.json({ error: 'Unsupported dataset' }, { status: 400 })

  if (dataset === 'all') {
    const [fillupRows, maintenanceRows] = await Promise.all([
      db.select().from(fillups).where(eq(fillups.vehicleId, vehicleId)).orderBy(asc(fillups.date)),
      db.select().from(maintenance).where(eq(maintenance.vehicleId, vehicleId)).orderBy(asc(maintenance.date)),
    ])

    if (format === 'json') {
      return NextResponse.json(
        { vehicleId, vehicleName: vehicle.name, fillups: fillupRows, maintenance: maintenanceRows },
        {
          headers: {
            'Content-Disposition': `attachment; filename="${vehicle.name.replace(/\s+/g, '_')}_all.json"`,
          },
        },
      )
    }

    const fillupsCsv = toCsv(fillupRows.map(r => ({
      date: r.date,
      odometer: r.odometer,
      cost: r.cost,
      gallons: r.gallons,
      dolPerGallon: r.dolPerGallon,
      milesTravelled: r.milesTravelled,
      milesPerGallon: r.milesPerGallon,
      createdAt: r.createdAt,
    })))
    const maintenanceCsv = toCsv(maintenanceRows.map(r => ({
      date: r.date,
      type: r.type,
      odometer: r.odometer,
      cost: r.cost,
      notes: r.notes,
      details: r.details,
      createdAt: r.createdAt,
    })))
    const body = [
      '# Fillups',
      fillupsCsv || 'date,odometer,cost,gallons,dolPerGallon,milesTravelled,milesPerGallon,createdAt',
      '',
      '# Maintenance',
      maintenanceCsv || 'date,type,odometer,cost,notes,details,createdAt',
      '',
    ].join('\n')
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${vehicle.name.replace(/\s+/g, '_')}_all.csv"`,
      },
    })
  }

  if (dataset === 'fillups') {
    const rows = await db
      .select()
      .from(fillups)
      .where(eq(fillups.vehicleId, vehicleId))
      .orderBy(asc(fillups.date))

    if (format === 'json') {
      return NextResponse.json(rows, {
        headers: {
          'Content-Disposition': `attachment; filename="${vehicle.name.replace(/\s+/g, '_')}_fillups.json"`,
        },
      })
    }

    const csvRows = rows.map(r => ({
      date: r.date,
      odometer: r.odometer,
      cost: r.cost,
      gallons: r.gallons,
      dolPerGallon: r.dolPerGallon,
      milesTravelled: r.milesTravelled,
      milesPerGallon: r.milesPerGallon,
      createdAt: r.createdAt,
    }))
    const body = toCsv(csvRows)
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${vehicle.name.replace(/\s+/g, '_')}_fillups.csv"`,
      },
    })
  }

  const rows = await db
    .select()
    .from(maintenance)
    .where(eq(maintenance.vehicleId, vehicleId))
    .orderBy(asc(maintenance.date))

  if (format === 'json') {
    return NextResponse.json(rows, {
      headers: {
        'Content-Disposition': `attachment; filename="${vehicle.name.replace(/\s+/g, '_')}_maintenance.json"`,
      },
    })
  }

  const csvRows = rows.map(r => ({
    date: r.date,
    type: r.type,
    odometer: r.odometer,
    cost: r.cost,
    notes: r.notes,
    details: r.details,
    createdAt: r.createdAt,
  }))
  const body = toCsv(csvRows)
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${vehicle.name.replace(/\s+/g, '_')}_maintenance.csv"`,
    },
  })
}
