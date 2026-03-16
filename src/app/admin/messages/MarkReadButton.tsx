'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkReadButton({ messageId }: { messageId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await fetch(`/api/messages/${messageId}`, { method: 'PATCH' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 font-medium transition-colors"
    >
      {loading ? '…' : 'Mark read'}
    </button>
  )
}
