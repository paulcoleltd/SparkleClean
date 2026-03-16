'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name:     form.get('name'),
      email:    form.get('email'),
      password: form.get('password'),
    }

    const res = await fetch('/api/account/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as any)?.error?.message ?? 'Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // Auto-login after successful registration
    const { signIn } = await import('next-auth/react')
    await signIn('customer-credentials', {
      email:      body.email,
      password:   body.password,
      callbackUrl: '/account/bookings',
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-2">
            <span className="text-brand-500">✦</span> SparkleClean
          </Link>
          <p className="text-gray-500 text-sm mt-1">Create an account to manage your bookings</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-gray-200 p-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="name" name="name" type="text" autoComplete="name" required minLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password"
              required minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60
                       text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/account/login" className="text-brand-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-gray-400">
          Booked as a guest? Sign in with the same email to see your bookings.
        </p>
      </div>
    </div>
  )
}
