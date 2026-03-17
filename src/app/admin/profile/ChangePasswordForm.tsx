'use client'

import { useState } from 'react'

export default function ChangePasswordForm() {
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    if (next.length < 12) {
      setError('New password must be at least 12 characters.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/admin/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: current, newPassword: next }),
    })

    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      setError(data.error ?? 'Failed to update password.')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
        <input
          type="password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password <span className="text-gray-400 font-normal">(min 12 characters)</span></label>
        <input
          type="password"
          value={next}
          onChange={e => setNext(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error   && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Password updated successfully.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        {saving ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
