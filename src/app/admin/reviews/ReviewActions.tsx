'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewActions({
  reviewId,
  currentStatus,
}: {
  reviewId:      string
  currentStatus: string
}) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(status: 'PUBLISHED' | 'REJECTED') {
    setLoading(true)
    await fetch(`/api/reviews/${reviewId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== 'PUBLISHED' && (
        <button
          onClick={() => update('PUBLISHED')}
          disabled={loading}
          className="px-3 py-1 text-xs rounded-lg bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 font-medium transition-colors"
        >
          Publish
        </button>
      )}
      {currentStatus !== 'REJECTED' && (
        <button
          onClick={() => update('REJECTED')}
          disabled={loading}
          className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 font-medium transition-colors"
        >
          Reject
        </button>
      )}
    </div>
  )
}
