'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'confirming' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    setState('loading')
    setError(null)

    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Failed to cancel. Please try again.')
      setState('idle')
      return
    }

    router.push('/account/bookings?cancelled=1')
    router.refresh()
  }

  if (state === 'confirming') {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Cancel this booking?</span>
        <button
          onClick={cancel}
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Yes, cancel
        </button>
        <button
          onClick={() => setState('idle')}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
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
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        {state === 'loading' ? 'Cancelling…' : 'Cancel'}
      </button>
    </span>
  )
}
