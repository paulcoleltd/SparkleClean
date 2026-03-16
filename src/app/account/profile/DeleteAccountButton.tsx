'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type State = 'idle' | 'confirming' | 'deleting'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function handleDelete() {
    setState('deleting')
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Failed to delete account')
      setState('confirming')
      return
    }
    // Account deleted — redirect to home (session will expire)
    router.push('/?deleted=1')
  }

  if (state === 'idle') {
    return (
      <button
        onClick={() => setState('confirming')}
        className="text-sm text-red-600 hover:text-red-700 underline underline-offset-2 transition-colors"
      >
        Delete my account
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-sm font-medium text-red-800">Are you sure?</p>
      <p className="text-xs text-red-700">
        This permanently deletes your account. Your booking history will be anonymised and cannot be recovered.
      </p>
      {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={state === 'deleting'}
          className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 transition-colors"
        >
          {state === 'deleting' ? 'Deleting…' : 'Yes, delete my account'}
        </button>
        <button
          onClick={() => { setState('idle'); setError('') }}
          disabled={state === 'deleting'}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
