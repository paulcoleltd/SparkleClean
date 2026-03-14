'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelScheduleButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'confirming' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    setState('loading')
    setError(null)

    const res = await fetch(`/api/recurring/${scheduleId}/cancel`, { method: 'POST' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Failed to cancel schedule')
      setState('idle')
      return
    }

    router.refresh()
    setState('idle')
  }

  if (state === 'confirming') {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-700">Cancel this schedule and all future bookings?</p>
        <button onClick={cancel}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
          Yes, cancel series
        </button>
        <button onClick={() => setState('idle')} className="text-sm text-gray-500 hover:text-gray-700">
          No
        </button>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <button
        onClick={() => setState('confirming')}
        disabled={state === 'loading'}
        className="px-4 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? 'Cancelling…' : 'Cancel Entire Series'}
      </button>
    </div>
  )
}
