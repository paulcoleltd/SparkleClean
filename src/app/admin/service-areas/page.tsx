import { Metadata } from 'next'
import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { getServiceAreas } from '@/services/serviceAreaService'
import ServiceAreaManager from './ServiceAreaManager'

export const metadata: Metadata = { title: 'Service Areas — SparkleClean Admin' }

export default async function ServiceAreasPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/admin/login')

  const areas = await getServiceAreas()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define which postcode areas you serve. The booking form will warn customers outside your coverage.
        </p>
      </div>
      <ServiceAreaManager initial={areas} />
    </div>
  )
}
