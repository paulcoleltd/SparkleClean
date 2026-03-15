import { auth, signOut } from '../../../auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Admin — SparkleClean' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // No session — render children as-is (handles the login page itself)
  // Middleware protects all other /admin/* routes from unauthenticated access
  if (!session?.user) return <>{children}</>

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/admin/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="text-brand-500">✦</span> SparkleClean
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/bookings"  className="text-gray-600 hover:text-gray-900 transition-colors">Bookings</Link>
              <Link href="/admin/recurring" className="text-gray-600 hover:text-gray-900 transition-colors">Recurring</Link>
              <Link href="/admin/reviews"   className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</Link>
              <Link href="/admin/messages"  className="text-gray-600 hover:text-gray-900 transition-colors">Messages</Link>
              <Link href="/admin/cleaners"  className="text-gray-600 hover:text-gray-900 transition-colors">Cleaners</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{session.user.email}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
