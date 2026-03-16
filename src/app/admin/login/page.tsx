import { signIn } from '../../../../auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Login — SparkleClean' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string }
}) {
  const { error, callbackUrl } = searchParams

  async function login(formData: FormData) {
    'use server'
    try {
      await signIn('admin-credentials', {
        email:      formData.get('email'),
        password:   formData.get('password'),
        redirectTo: callbackUrl ?? '/admin/bookings',
      })
    } catch (err) {
      if (err instanceof AuthError) {
        redirect('/admin/login?error=CredentialsSignin')
      }
      throw err
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SparkleClean Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage bookings</p>
        </div>

        {/* Error */}
        {error === 'CredentialsSignin' && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            Invalid email or password. Please try again.
          </div>
        )}

        {/* Form */}
        <form action={login} className="bg-white shadow-sm rounded-xl border border-gray-200 p-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="admin@sparkleclean.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white
                       font-medium text-sm rounded-lg transition-colors focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
