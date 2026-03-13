'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CleanerLoginPage() {
  const router = useRouter()
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form     = new FormData(e.currentTarget)
    const email    = form.get('email')    as string
    const password = form.get('password') as string

    const result = await signIn('cleaner-credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/cleaner/bookings')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl text-brand-500">✦</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Cleaner Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to view your assigned bookings</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
