'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCleanerPage() {
  const router = useRouter()
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name:     form.get('name')     as string,
      email:    form.get('email')    as string,
      password: form.get('password') as string,
      phone:    form.get('phone')    as string || undefined,
    }

    const res = await fetch('/api/admin/cleaners', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error?.message ?? 'Failed to create cleaner')
      setLoading(false)
      return
    }

    router.push('/admin/cleaners')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/cleaners" className="hover:text-gray-900">Cleaners</Link>
        <span>/</span>
        <span className="text-gray-900">New Cleaner</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add New Cleaner</h1>

      <div className="max-w-md">
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
          )}

          {[
            { name: 'name',     label: 'Full Name',  type: 'text',     required: true  },
            { name: 'email',    label: 'Email',       type: 'email',    required: true  },
            { name: 'password', label: 'Password',    type: 'password', required: true  },
            { name: 'phone',    label: 'Phone',       type: 'tel',      required: false },
          ].map(({ name, label, type, required }) => (
            <div key={name} className="flex flex-col gap-1">
              <label htmlFor={name} className="text-sm font-medium text-gray-700">
                {label}{required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                required={required}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create Cleaner'}
            </button>
            <Link
              href="/admin/cleaners"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
