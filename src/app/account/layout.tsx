import { auth, signOut } from '../../../auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My Account — SparkleClean' }

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  // Login and register pages are public — only show the nav shell when signed in
  if (!session?.user) return <>{children}</>

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/account/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="text-brand-500">✦</span> SparkleClean
            </Link>
            <Link href="/account/bookings" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              My Bookings
            </Link>
            <Link href="/account/profile" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Profile
            </Link>
            <Link href="/account/referral" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Refer a Friend
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500 hidden sm:block">{session.user.name ?? session.user.email}</span>
            <form action={handleSignOut}>
              <button type="submit" className="text-gray-500 hover:text-gray-900 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
