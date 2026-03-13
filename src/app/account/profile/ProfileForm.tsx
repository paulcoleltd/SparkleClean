'use client'

import { useState } from 'react'

interface Props {
  initialName:  string
  email:        string
}

export default function ProfileForm({ initialName, email }: Props) {
  const [name,            setName]            = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving,          setSaving]          = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    const body: Record<string, string> = {}
    if (name.trim() !== initialName) body.name = name.trim()
    if (newPassword) {
      body.currentPassword = currentPassword
      body.newPassword     = newPassword
    }

    if (Object.keys(body).length === 0) return

    setSaving(true)
    const res = await fetch('/api/account/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Failed to save changes')
      return
    }

    setSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setSuccess(false), 4000)
  }

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          minLength={2}
          maxLength={100}
          required
          className={inp}
        />
      </div>

      {/* Email — read-only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          value={email}
          disabled
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Email address cannot be changed.</p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-4">Change Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></p>

        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inp}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              className={inp}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              className={inp}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Profile updated successfully.</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
