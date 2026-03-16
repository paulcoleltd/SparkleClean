'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PromoCode {
  id:            string
  code:          string
  description:   string | null
  discountType:  'PERCENTAGE' | 'FIXED'
  discountValue: number
  maxUses:       number | null
  uses:          number
  active:        boolean
  expiresAt:     string | null
  _count:        { bookings: number }
}

function formatDiscount(type: string, value: number) {
  return type === 'PERCENTAGE' ? `${value / 100}% off` : `£${(value / 100).toFixed(2)} off`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PromoTable({ initial }: { initial: PromoCode[] }) {
  const router = useRouter()
  const [codes,   setCodes]   = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggle(id: string, active: boolean) {
    setLoading(id)
    await fetch(`/api/admin/promos/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active }),
    })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active } : c))
    setLoading(null)
  }

  async function remove(id: string, code: string) {
    if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return
    setLoading(id)
    await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
    setLoading(null)
    router.refresh()
  }

  if (codes.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No promo codes yet. Create one above.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Code', 'Discount', 'Uses', 'Expires', 'Status', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {codes.map(c => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-semibold text-gray-900">{c.code}</td>
              <td className="px-4 py-3 text-gray-700">
                {formatDiscount(c.discountType, c.discountValue)}
                {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(c.expiresAt)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggle(c.id, !c.active)}
                    disabled={loading === c.id}
                    className="text-xs text-brand-600 hover:text-brand-800 disabled:opacity-50"
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => remove(c.id, c.code)}
                    disabled={loading === c.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
