'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePromoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form  = new FormData(e.currentTarget)
    const dtype = form.get('discountType') as string
    const dval  = parseFloat(form.get('discountValue') as string)
    const max   = form.get('maxUses') ? parseInt(form.get('maxUses') as string, 10) : null
    const exp   = form.get('expiresAt') ? new Date(form.get('expiresAt') as string).toISOString() : null

    const body = {
      code:          (form.get('code') as string).toUpperCase().trim(),
      description:   (form.get('description') as string) || undefined,
      discountType:  dtype,
      discountValue: dtype === 'PERCENTAGE' ? Math.round(dval * 100) : Math.round(dval * 100),
      maxUses:       max,
      expiresAt:     exp,
    }

    const res = await fetch('/api/admin/promos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: { message?: string } })?.error?.message ?? 'Failed to create promo code')
      setLoading(false)
      return
    }

    ;(e.currentTarget as HTMLFormElement).reset()
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Create Promo Code</h2>

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code <span className="text-red-500">*</span></label>
          <input name="code" required placeholder="WELCOME20" pattern="[A-Za-z0-9_-]+"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type <span className="text-red-500">*</span></label>
          <select name="discountType" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed amount (£)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value <span className="text-red-500">*</span></label>
          <input name="discountValue" type="number" step="0.01" min="0.01" required placeholder="e.g. 15 for 15% or 20 for £20"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input name="description" placeholder="e.g. Welcome offer for new customers"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
          <input name="maxUses" type="number" min="1" placeholder="Leave blank for unlimited"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
          <input name="expiresAt" type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
        {loading ? 'Creating…' : 'Create Code'}
      </button>
    </form>
  )
}
