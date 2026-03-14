'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Cleaner {
  id:   string
  name: string
}

export function CleanerAssignmentSelect({
  bookingId,
  cleaners,
  currentCleanerId,
}: {
  bookingId:        string
  cleaners:         Cleaner[]
  currentCleanerId: string | null
}) {
  const router       = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string>(currentCleanerId ?? '')
  const [error, setError]       = useState<string | null>(null)

  async function assign(cleanerId: string | null) {
    setError(null)
    const res = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cleanerId }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Failed to assign cleaner')
      return
    }
    setSelected(cleanerId ?? '')
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-2">
      <label htmlFor="cleaner-select" className="text-sm font-medium text-gray-700">
        Assigned Cleaner
      </label>
      <div className="flex gap-2">
        <select
          id="cleaner-select"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={isPending}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">— Unassigned —</option>
          {cleaners.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => assign(selected || null)}
          disabled={isPending}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      {!error && selected !== (currentCleanerId ?? '') && (
        <p className="text-xs text-gray-400">Unsaved changes</p>
      )}
    </div>
  )
}
