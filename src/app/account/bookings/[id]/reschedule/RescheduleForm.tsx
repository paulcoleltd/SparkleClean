'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { TIME_LABELS } from '@/types/booking'

const TIME_SLOTS = Object.entries(TIME_LABELS) as [string, string][]

// Minimum date for the input: tomorrow (ISO format)
function minDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0] as string
}

interface Props {
  bookingId:      string
  currentDate:    string  // YYYY-MM-DD
  currentTimeSlot: string // MORNING | AFTERNOON | EVENING
}

export default function RescheduleForm({ bookingId, currentDate, currentTimeSlot }: Props) {
  const [date, setDate]         = useState(currentDate)
  const [timeSlot, setTimeSlot] = useState(currentTimeSlot)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router                  = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date, timeSlot }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to reschedule. Please try again.')
        return
      }

      router.push('/account/bookings?rescheduled=1')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date picker */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          New date
        </label>
        <input
          id="date"
          type="date"
          required
          min={minDate()}
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Time slot */}
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">Time slot</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIME_SLOTS.map(([value, label]) => {
            const [name, hours] = label.split(' (')
            return (
              <label
                key={value}
                className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  timeSlot === value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="timeSlot"
                  value={value}
                  checked={timeSlot === value}
                  onChange={() => setTimeSlot(value)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-gray-900">{name}</span>
                <span className="text-xs text-gray-500">({hours?.replace(')', '') ?? ''})</span>
              </label>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !date || !timeSlot}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving…' : 'Confirm Reschedule'}
        </button>
      </div>
    </form>
  )
}
