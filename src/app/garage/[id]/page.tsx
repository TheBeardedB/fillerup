import { notFound } from 'next/navigation'
import { db } from '@/db'
import { fillups, vehicles, maintenance } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { VehicleDetail } from '@/components/VehicleDetail'

interface Props {
  params: { id: string }
}

export default async function VehicleDetailPage({ params }: Props) {
  const id = Number(params.id)
  if (isNaN(id)) notFound()

  const [vehicle, data, serviceRecords] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.id, id)).then(r => r[0] ?? null),
    db.select().from(fillups).where(eq(fillups.vehicleId, id)).orderBy(asc(fillups.date)),
    db.select().from(maintenance).where(eq(maintenance.vehicleId, id)).orderBy(asc(maintenance.date)),
  ])

  if (!vehicle) notFound()

  return <VehicleDetail vehicle={vehicle} data={data} serviceRecords={serviceRecords} />
}
