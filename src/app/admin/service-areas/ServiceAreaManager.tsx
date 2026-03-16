'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Area {
  id:        string
  name:      string
  postcodes: string[]
  active:    boolean
}

export default function ServiceAreaManager({ initial }: { initial: Area[] }) {
  const router = useRouter()
  const [areas,   setAreas]   = useState(initial)
  const [name,    setName]    = useState('')
  const [codes,   setCodes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const postcodes = codes.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    const res = await fetch('/api/admin/service-areas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, postcodes }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError((j as { error?: { message?: string } })?.error?.message ?? 'Failed to create')
    } else {
      setName(''); setCodes(''); router.refresh()
    }
    setSaving(false)
  }

  async function toggle(id: string, active: boolean) {
    setLoading(id)
    await fetch(`/api/admin/service-areas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ active }),
    })
    setAreas(prev => prev.map(a => a.id === id ? { ...a, active } : a))
    setLoading(null)
  }

  async function remove(id: string, areaName: string) {
    if (!confirm(`Delete service area "${areaName}"?`)) return
    setLoading(id)
    await fetch(`/api/admin/service-areas/${id}`, { method: 'DELETE' })
    setAreas(prev => prev.filter(a => a.id !== id))
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={create} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Add Service Area</h2>
        {error && <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Central London"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode prefixes <span className="text-red-500">*</span></label>
            <input value={codes} onChange={e => setCodes(e.target.value)} required placeholder="SW1, SW1A, EC1, WC2 (comma or space separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <p className="mt-1 text-xs text-gray-400">Prefix-matched — "SW1" covers SW1A, SW1P, etc.</p>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
          {saving ? 'Adding…' : 'Add Area'}
        </button>
      </form>

      {/* Areas table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Service Areas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            If no areas are configured, all postcodes are accepted. Add areas to restrict coverage.
          </p>
        </div>
        {areas.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No service areas configured — all postcodes accepted.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Postcode Prefixes', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {areas.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{a.postcodes.join(', ')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(a.id, !a.active)} disabled={loading === a.id}
                        className="text-xs text-brand-600 hover:text-brand-800 disabled:opacity-50">
                        {a.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => remove(a.id, a.name)} disabled={loading === a.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
