'use client'

import { useState } from 'react'

const TIME_SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'] as const
const TIME_LABELS: Record<string, string> = {
  MORNING:   'Morning (8am–12pm)',
  AFTERNOON: 'Afternoon (12pm–4pm)',
  EVENING:   'Evening (4pm–6pm)',
}

interface Row { dayOfWeek: number; timeSlots: string[] }

export default function AvailabilityEditor({
  initial,
  dayNames,
}: {
  initial:  Row[]
  dayNames: string[]
}) {
  const [schedule, setSchedule] = useState<Row[]>(initial)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  function toggle(dayOfWeek: number, slot: string) {
    setSchedule(prev => prev.map(r => {
      if (r.dayOfWeek !== dayOfWeek) return r
      const has = r.timeSlots.includes(slot)
      return { ...r, timeSlots: has ? r.timeSlots.filter(s => s !== slot) : [...r.timeSlots, slot] }
    }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/cleaner/availability', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ schedule }),
    })
    if (!res.ok) {
      setError('Failed to save. Please try again.')
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
            {TIME_SLOTS.map(s => (
              <th key={s} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{TIME_LABELS[s]}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {schedule.map(row => (
            <tr key={row.dayOfWeek} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{dayNames[row.dayOfWeek]}</td>
              {TIME_SLOTS.map(slot => (
                <td key={slot} className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={row.timeSlots.includes(slot)}
                    onChange={() => toggle(row.dayOfWeek, slot)}
                    className="h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {saving ? 'Saving…' : 'Save Availability'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
