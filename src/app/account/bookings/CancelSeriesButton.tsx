'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelSeriesButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'confirming' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    setState('loading')
    setError(null)

    const res = await fetch(`/api/recurring/${scheduleId}/cancel`, { method: 'POST' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Failed to cancel series')
      setState('idle')
      return
    }

    router.refresh()
  }

  if (state === 'confirming') {
    return (
      <span className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-600">Cancel all future bookings in this series?</span>
        <button onClick={cancel} className="text-xs text-red-600 hover:text-red-700 font-medium">
          Yes, cancel series
        </button>
        <button onClick={() => setState('idle')} className="text-xs text-gray-500 hover:text-gray-700">
          No
        </button>
      </span>
    )
  }

  return (
    <span>
      {error && <span className="text-xs text-red-600 mr-2">{error}</span>}
      <button
        onClick={() => setState('confirming')}
        disabled={state === 'loading'}
        className="text-xs text-orange-500 hover:text-orange-700 disabled:opacity-50"
      >
        {state === 'loading' ? 'Cancelling…' : 'Cancel series'}
      </button>
    </span>
  )
}
