export const dynamic = 'force-dynamic'

import { auth } from '../../../../auth'
import { getCustomerById } from '@/services/customerService'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'
import DeleteAccountButton from './DeleteAccountButton'

export const metadata = { title: 'Profile — SparkleClean' }

export default async function ProfilePage() {
  const session  = await auth()
  if (!session?.user) redirect('/account/login')

  const customer = await getCustomerById(session.user.id)
  if (!customer) redirect('/account/login')

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
        <p className="text-sm text-gray-500">Update your name or change your password.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ProfileForm initialName={customer.name} email={customer.email} />
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-400 mb-4">
          Permanently delete your account and anonymise your booking history.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  )
}
