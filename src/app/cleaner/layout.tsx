import { auth, signOut } from '../../../auth'
import { redirect } from 'next/navigation'

export default async function CleanerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Allow the login page to render unauthenticated
  if (!session?.user && false) redirect('/cleaner/login')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-brand-500">✦</span>
            <span className="font-semibold text-gray-900">SparkleClean</span>
            <span className="ml-2 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              Cleaner Portal
            </span>
          </div>

          {session?.user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user.name ?? session.user.email}</span>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/cleaner/login' })
                }}
              >
                <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
