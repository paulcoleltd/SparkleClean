import { signIn, auth } from '../../../../auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Sign In — SparkleClean' }

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect('/account/bookings')

  const { error, callbackUrl } = await searchParams

  async function login(formData: FormData) {
    'use server'
    try {
      await signIn('customer-credentials', {
        email:      formData.get('email'),
        password:   formData.get('password'),
        redirectTo: callbackUrl ?? '/account/bookings',
      })
    } catch (err) {
      if (err instanceof AuthError) {
        redirect('/account/login?error=CredentialsSignin')
      }
      throw err
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 mb-2">
            <span className="text-brand-500">✦</span> SparkleClean
          </Link>
          <p className="text-gray-500 text-sm mt-1">Sign in to view your bookings</p>
        </div>

        {error === 'CredentialsSignin' && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            Invalid email or password. Please try again.
          </div>
        )}

        <form action={login} className="bg-white shadow-sm rounded-xl border border-gray-200 p-8 space-y-5">
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
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <Link href="/account/forgot-password" className="text-xs text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password" name="password" type="password" autoComplete="current-password" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm
                       font-medium rounded-lg transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/account/register" className="text-brand-600 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
