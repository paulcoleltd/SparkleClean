export const dynamic = 'force-dynamic'

import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata: Metadata = { title: 'Admin Profile — SparkleClean' }

export default async function AdminProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/admin/login')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Signed in as <span className="font-medium">{session.user.email}</span></p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
