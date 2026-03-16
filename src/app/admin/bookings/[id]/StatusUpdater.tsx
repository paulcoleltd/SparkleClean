'use client'

import { useState } from 'react'
import type { BookingStatus } from '@prisma/client'

const STATUSES: BookingStatus[] = ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PENDING:         'Pending',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
}

interface Props {
  bookingId: string
  currentStatus: BookingStatus
}

export default function StatusUpdater({ bookingId, currentStatus }: Props) {
  const [status, setStatus]   = useState<BookingStatus>(currentStatus)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Failed to update status')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Update Status</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setSaved(false) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              status === s
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <button
        onClick={save}
        disabled={saving || status === currentStatus}
        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50
                   text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Status'}
      </button>
    </div>
  )
}
