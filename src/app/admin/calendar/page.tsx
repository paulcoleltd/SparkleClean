import { Metadata } from 'next'
import WeekCalendar from './WeekCalendar'

export const metadata: Metadata = { title: 'Calendar — SparkleClean Admin' }

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Weekly view of all scheduled bookings. Colour-coded by assigned cleaner.
        </p>
      </div>
      <WeekCalendar />
    </div>
  )
}
