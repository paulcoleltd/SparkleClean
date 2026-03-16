import { Metadata } from 'next'
import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { getCleanerAvailability, DAY_NAMES } from '@/services/availabilityService'
import AvailabilityEditor from './AvailabilityEditor'

export const metadata: Metadata = { title: 'My Availability — SparkleClean' }

export default async function AvailabilityPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'cleaner') redirect('/cleaner/login')

  const availability = await getCleanerAvailability(session.user.id!)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Availability</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set the days and times you are available to work. Admin uses this to assign you bookings.
        </p>
      </div>
      <AvailabilityEditor initial={availability} cleanerId={session.user.id!} dayNames={DAY_NAMES} />
    </div>
  )
}
