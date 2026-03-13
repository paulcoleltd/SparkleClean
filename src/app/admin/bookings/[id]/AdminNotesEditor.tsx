'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookingId:  string
  initialNotes: string | null
}

export default function AdminNotesEditor({ bookingId, initialNotes }: Props) {
  const [notes, setNotes]     = useState(initialNotes ?? '')
  const [saved, setSaved]     = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(value: string) {
    setNotes(value)
    setSaved(false)
    setError(null)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}/notes`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ adminNotes: notes.trim() || null }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data?.error?.message ?? 'Failed to save notes')
          return
        }
        setSaved(true)
        router.refresh()
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Staff Notes</h2>
        {saved && !isPending && (
          <span className="text-xs text-green-600">Saved</span>
        )}
      </div>

      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        rows={5}
        placeholder="Internal notes visible to admin only…"
        className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending || saved}
        className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Saving…' : 'Save Notes'}
      </button>
    </div>
  )
}
